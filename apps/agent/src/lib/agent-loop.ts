import Anthropic from '@anthropic-ai/sdk'
import type { Db } from '@scrumbs/db'
import { agentTasks } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import type { SSEEvent, PersonaName } from '@scrumbs/types'
import { SSEEmitter } from './sse.js'
import { executeToolCalls } from './tool-executor.js'
import { getAllTools } from './tools/index.js'
import type { ToolContext } from './tools/index.js'
import { createWorkspace } from './workspace.js'
import type { Workspace } from './workspace.js'
import { checkConcurrencyLimit, checkTokenBudget, incrementTokensUsed, BudgetExceededError, ConcurrencyLimitError } from './cost-guard.js'
import { retryWithBackoff } from './retry.js'
import { maybeSummariseHistory } from './context-window.js'
import {
  buildPabloSystemPrompt,
  buildStellaSystemPrompt,
  buildViktorSystemPrompt,
  buildRexSystemPrompt,
  buildQuinnSystemPrompt,
  buildDexSystemPrompt,
  buildMaxSystemPrompt,
} from '@scrumbs/personas'

const SSE_BUFFER_CLEANUP_DELAY_MS = 30_000
const MODEL = 'claude-sonnet-4-20250514'
const MAX_TURNS = 50

// In-memory map of active emitters (populated by the SSE route)
const activeEmitters = new Map<string, SSEEmitter>()

export function registerEmitter(taskId: string, emitter: SSEEmitter): void {
  activeEmitters.set(taskId, emitter)
}

export function unregisterEmitter(taskId: string): void {
  activeEmitters.delete(taskId)
}

function getEmitter(taskId: string): SSEEmitter | undefined {
  return activeEmitters.get(taskId)
}

async function isTaskCancelled(db: Db, taskId: string): Promise<boolean> {
  const [task] = await db
    .select({ status: agentTasks.status })
    .from(agentTasks)
    .where(eq(agentTasks.id, taskId))
  return task?.status === 'cancelled'
}

/**
 * Personas that use tools and need a workspace (they interact with code).
 */
const TOOL_PERSONAS: Set<PersonaName> = new Set(['viktor', 'rex', 'quinn', 'dex', 'max'])

/**
 * Conversational personas that only produce text output (no tools/workspace).
 */
const CONVERSATIONAL_PERSONAS: Set<PersonaName> = new Set(['pablo', 'stella'])

/**
 * Build the system prompt for a given persona and input.
 */
function buildSystemPrompt(personaName: PersonaName, input: Record<string, unknown>): string {
  switch (personaName) {
    case 'pablo':
      return buildPabloSystemPrompt(input as unknown as Parameters<typeof buildPabloSystemPrompt>[0])
    case 'stella':
      return buildStellaSystemPrompt(input as unknown as Parameters<typeof buildStellaSystemPrompt>[0])
    case 'viktor':
      return buildViktorSystemPrompt(input as unknown as Parameters<typeof buildViktorSystemPrompt>[0])
    case 'rex':
      return buildRexSystemPrompt(input as unknown as Parameters<typeof buildRexSystemPrompt>[0])
    case 'quinn':
      return buildQuinnSystemPrompt(input as unknown as Parameters<typeof buildQuinnSystemPrompt>[0])
    case 'dex':
      return buildDexSystemPrompt(input as unknown as Parameters<typeof buildDexSystemPrompt>[0])
    case 'max':
      return buildMaxSystemPrompt()
    default: {
      const _exhaustive: never = personaName
      throw new Error(`Unknown persona: ${personaName}`)
    }
  }
}

export async function runAgentTask(
  taskId: string,
  db: Db,
  personaName: PersonaName,
  input: Record<string, unknown>,
  userId: string
): Promise<void> {
  // Fetch task from DB
  const [task] = await db
    .select()
    .from(agentTasks)
    .where(eq(agentTasks.id, taskId))

  if (!task) throw new Error(`Task ${taskId} not found`)

  const sessionId = task.sessionId ?? taskId

  const emit = (event: Omit<SSEEvent, 'taskId' | 'sessionId' | 'timestamp'>): void => {
    const emitter = getEmitter(taskId)
    if (emitter) {
      emitter.emit({
        ...event,
        taskId,
        sessionId,
        timestamp: new Date().toISOString(),
      })
    }
  }

  let workspace: Workspace | null = null

  try {
    // 1. Check concurrency limit
    await checkConcurrencyLimit(db, userId)

    // 2. Update task to running
    await db
      .update(agentTasks)
      .set({ status: 'running', updatedAt: new Date() })
      .where(eq(agentTasks.id, taskId))

    // 3. Build system prompt
    const systemPrompt = buildSystemPrompt(personaName, input)

    // 4. Set up workspace if persona uses tools and input has repo info
    const needsTools = TOOL_PERSONAS.has(personaName)
    const githubRepo = input.githubRepo as string | undefined
    const githubToken = input.githubToken as string | undefined

    if (needsTools && githubRepo && githubToken) {
      workspace = await createWorkspace(taskId, githubRepo, githubToken)
      // Inject workspaceDir into input if not already set
      if (!input.workspaceDir) {
        input.workspaceDir = workspace.dir
      }
    }

    // 5. Prepare Claude API client
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is required')
    }
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    // Build tool definitions for the API
    const tools: Anthropic.Tool[] = needsTools
      ? getAllTools().map((t) => ({
          name: t.name,
          description: t.description,
          input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
        }))
      : []

    // Build tool context
    const toolContext: ToolContext = {
      workspaceDir: workspace?.dir ?? '',
      env: workspace?.cleanEnv ?? process.env,
      gitEnv: workspace?.gitEnv ?? process.env,
      taskId,
    }

    // Initialize messages
    let messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: `Begin your task. Your input parameters:\n\n${JSON.stringify(input, null, 2)}`,
      },
    ]

    // 6. Main agent loop
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      // Check cancellation
      if (await isTaskCancelled(db, taskId)) {
        await db.update(agentTasks).set({ status: 'cancelled' }).where(eq(agentTasks.id, taskId))
        emit({ type: 'done', payload: { cancelled: true } })
        return
      }

      // Check token budget before calling Claude
      const estimatedInputTokens = Math.ceil(JSON.stringify(messages).length / 4)
      await checkTokenBudget(db, taskId, estimatedInputTokens)

      // Call Claude with retry
      const response = await retryWithBackoff(
        () =>
          client.messages.create({
            model: MODEL,
            max_tokens: 4096,
            system: systemPrompt,
            messages,
            ...(tools.length > 0 ? { tools } : {}),
          }),
        3,
        (attempt, err) => {
          emit({
            type: 'retry',
            payload: { attempt, error: err instanceof Error ? err.message : String(err) },
          })
        }
      )

      // Track token usage
      const totalTokens = (response.usage?.input_tokens ?? 0) + (response.usage?.output_tokens ?? 0)
      await incrementTokensUsed(db, taskId, totalTokens)

      // Check if usage exceeds 80% of budget and warn
      const [taskState] = await db.select({ tokensBudget: agentTasks.tokensBudget, tokensUsed: agentTasks.tokensUsed })
        .from(agentTasks).where(eq(agentTasks.id, taskId))
      if (taskState && taskState.tokensBudget > 0 && taskState.tokensUsed > taskState.tokensBudget * 0.8) {
        emit({ type: 'error', payload: {
          warning: true,
          message: `Token budget at ${Math.round((taskState.tokensUsed / taskState.tokensBudget) * 100)}% — task will auto-cancel at 100%`
        }})
      }

      // Process response content blocks
      const textBlocks: string[] = []
      const toolUseBlocks: Array<{ type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }> = []

      for (const block of response.content) {
        if (block.type === 'text') {
          textBlocks.push(block.text)
          emit({ type: 'message', payload: block.text })
        } else if (block.type === 'tool_use') {
          toolUseBlocks.push({
            type: 'tool_use',
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          })
        }
      }

      // If stop reason is end_turn (no tool use), we're done
      if (response.stop_reason === 'end_turn') {
        // Store the final output
        const finalOutput = textBlocks.join('\n\n')
        await db
          .update(agentTasks)
          .set({
            status: 'completed',
            outputJson: { text: finalOutput },
            updatedAt: new Date(),
          })
          .where(eq(agentTasks.id, taskId))

        emit({ type: 'done', payload: { success: true } })
        return
      }

      // Process tool calls if any
      if (toolUseBlocks.length > 0) {
        // Check cancellation before executing tools
        if (await isTaskCancelled(db, taskId)) {
          await db.update(agentTasks).set({ status: 'cancelled' }).where(eq(agentTasks.id, taskId))
          emit({ type: 'done', payload: { cancelled: true } })
          return
        }

        const toolResults = await executeToolCalls(toolUseBlocks, toolContext, emit, taskId, db)

        // Add assistant message with the full response content
        messages.push({
          role: 'assistant',
          content: response.content as Anthropic.ContentBlock[],
        })

        // Add tool results as a user message
        messages.push({
          role: 'user',
          content: toolResults,
        })
      }

      // Context window management — summarise if needed
      const { messages: summarised, summarised: didSummarise } = await maybeSummariseHistory(messages)
      if (didSummarise) {
        messages = summarised
        emit({ type: 'context_summary', payload: { message: 'Conversation history was summarised to fit context window' } })
      }
    }

    // If we hit MAX_TURNS, mark as completed with a note
    await db
      .update(agentTasks)
      .set({
        status: 'completed',
        outputJson: { text: 'Agent reached maximum turn limit' },
        updatedAt: new Date(),
      })
      .where(eq(agentTasks.id, taskId))

    emit({ type: 'done', payload: { success: true, maxTurnsReached: true } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    if (err instanceof ConcurrencyLimitError) {
      await db
        .update(agentTasks)
        .set({ status: 'failed', errorMessage: message, updatedAt: new Date() })
        .where(eq(agentTasks.id, taskId))

      emit({ type: 'error', payload: { message } })
      emit({ type: 'done', payload: { success: false } })
      return
    }

    if (err instanceof BudgetExceededError) {
      await db
        .update(agentTasks)
        .set({ status: 'failed', errorMessage: message, updatedAt: new Date() })
        .where(eq(agentTasks.id, taskId))

      emit({ type: 'error', payload: { message } })
      emit({ type: 'done', payload: { success: false } })
      return
    }

    await db
      .update(agentTasks)
      .set({ status: 'failed', errorMessage: message, updatedAt: new Date() })
      .where(eq(agentTasks.id, taskId))

    emit({ type: 'error', payload: { message } })
    emit({ type: 'done', payload: { success: false } })
  } finally {
    // Cleanup workspace
    if (workspace) {
      await workspace.cleanup().catch(() => {})
    }

    unregisterEmitter(taskId)
    setTimeout(() => SSEEmitter.clearBuffer(sessionId), SSE_BUFFER_CLEANUP_DELAY_MS)
  }
}
