# Scrumbs Full Wiring Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire all scaffolded code into a functional end-to-end product — from agent loop through every stage page.

**Architecture:** The agent loop is rewritten to call Claude via the Anthropic SDK, select personas, execute tools, and emit SSE events. Each web UI stage page creates an AgentTask via the agent client, connects to SSE, and displays results. Artifacts are created in the DB and committed to GitHub on approval.

**Tech Stack:** Next.js 15 (App Router), Fastify 5, Anthropic SDK, Drizzle ORM, SSE, Zod

---

## File Structure

### Agent Service (apps/agent/src/)
- **Modify:** `lib/agent-loop.ts` — Complete rewrite: Claude API loop with tool execution, persona selection, approval gates, context summarisation, cost tracking
- **Create:** `lib/tool-executor.ts` — Orchestrates tool calls: lookup from registry, approval gating, SSE event emission, result formatting
- **Modify:** `index.ts` — Import tool files to trigger self-registration
- **Modify:** `routes/tasks.ts` — Add `userId` to `runAgentTask` context for cost guard

### Web App — API Routes (apps/web/app/api/)
- **Create:** `projects/[projectId]/tasks/route.ts` — POST: creates AgentTask via agent-client, returns taskId+sessionId
- **Create:** `sprints/[sprintId]/approve-stage/route.ts` — POST: approves current stage artifact, advances sprint status, creates GitHub branch/PR as needed

### Web App — Pages (apps/web/app/projects/[projectId]/)
- **Modify:** `requirements/page.tsx` — Wire to agent: start Pablo task, SSE conversation, artifact display, approve button
- **Modify:** `prd/page.tsx` — Wire to agent: start Pablo PRD task, artifact display, approve + GitHub commit
- **Modify:** `sprints/[sprintId]/planning/page.tsx` — Wire Stella task, story creation, approval + branch creation
- **Modify:** `sprints/[sprintId]/development/page.tsx` — Wire Viktor task, terminal panel SSE, kanban updates
- **Modify:** `sprints/[sprintId]/review/page.tsx` — Wire Rex task, PR creation, review findings display
- **Modify:** `sprints/[sprintId]/qa/page.tsx` — Wire Quinn task, test result display
- **Modify:** `sprints/[sprintId]/deploy/page.tsx` — Wire Dex task, deploy status display
- **Modify:** `sprints/[sprintId]/retro/page.tsx` — Wire Stella retro task, retro artifact display

### Web App — Components (apps/web/components/)
- **Create:** `stage-workspace.tsx` — Reusable wrapper: creates task, manages SSE, shows conversation + artifact panels, approve button

### Web App — Lib (apps/web/lib/)
- **Modify:** `agent-client.ts` — Add types for task creation response

---

## Chunk 1: Agent Loop Core (Tasks 1-4)

The critical path. Everything else depends on a working agent loop.

### Task 1: Import tools to register them + add @anthropic-ai/sdk

**Files:**
- Modify: `apps/agent/src/index.ts`
- Modify: `apps/agent/package.json`

- [ ] **Step 1: Install Anthropic SDK**

```bash
npm install @anthropic-ai/sdk -w apps/agent
```

- [ ] **Step 2: Add tool imports to agent entry point**

Add side-effect imports at the top of `apps/agent/src/index.ts` (before route registration):

```ts
// Side-effect imports — tool files self-register via registerTool()
import './lib/tools/read-file.js'
import './lib/tools/write-file.js'
import './lib/tools/run-tests.js'
import './lib/tools/bash.js'
import './lib/tools/git-commit.js'
import './lib/tools/git-push.js'
```

- [ ] **Step 3: Add fail-fast check for ANTHROPIC_API_KEY**

Add to the env var checks in `apps/agent/src/index.ts`:

```ts
if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY environment variable is required')
```

- [ ] **Step 4: Verify tools are registered**

Write a quick test or add a log statement. Run the agent service and confirm 6 tools are registered.

- [ ] **Step 5: Commit**

```bash
git add apps/agent/src/index.ts apps/agent/package.json package-lock.json
git commit -m "feat(agent): register tools and add Anthropic SDK dependency"
```

---

### Task 2: Create tool executor module

**Files:**
- Create: `apps/agent/src/lib/tool-executor.ts`

This module takes a Claude `tool_use` content block, looks up the tool, handles approval if required, executes it, and returns the `tool_result` content block. It also emits SSE events.

- [ ] **Step 1: Write the failing test**

Create `apps/agent/src/lib/__tests__/tool-executor.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('tool-executor', () => {
  it('should be importable', async () => {
    const mod = await import('../tool-executor.js')
    expect(mod.executeToolCalls).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/lib/__tests__/tool-executor.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement tool-executor.ts**

```ts
import { getTool, type ToolContext } from './tools/index.js'
import { waitForApproval } from './approval.js'
import type { SSEEvent } from '@scrumbs/types'

interface ToolUseBlock {
  type: 'tool_use'
  id: string
  name: string
  input: Record<string, unknown>
}

interface ToolResultBlock {
  type: 'tool_result'
  tool_use_id: string
  content: string
  is_error?: boolean
}

export async function executeToolCalls(
  toolUseBlocks: ToolUseBlock[],
  context: ToolContext,
  emit: (event: SSEEvent) => void,
): Promise<ToolResultBlock[]> {
  const results: ToolResultBlock[] = []

  for (const block of toolUseBlocks) {
    const tool = getTool(block.name)
    if (!tool) {
      results.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: `Error: Unknown tool "${block.name}"`,
        is_error: true,
      })
      continue
    }

    // Emit tool_call event
    emit({
      type: 'tool_call',
      payload: { toolName: block.name, input: block.input },
    })

    // Approval gate
    if (tool.requiresApproval) {
      emit({
        type: 'approval_required',
        payload: {
          message: `${block.name} requires approval`,
          toolName: block.name,
          input: block.input,
        },
      })

      const approved = await waitForApproval(context.taskId)
      if (!approved) {
        results.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: 'Tool execution rejected by user.',
          is_error: true,
        })
        emit({ type: 'tool_output', payload: { toolName: block.name, output: 'Rejected by user' } })
        continue
      }
    }

    // Execute tool
    try {
      const output = await tool.execute(block.input, context)
      results.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: output,
      })

      // Emit appropriate event based on tool name
      const eventType = getEventTypeForTool(block.name)
      emit({ type: eventType, payload: { toolName: block.name, output } })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      results.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: `Error: ${message}`,
        is_error: true,
      })
      emit({ type: 'error', payload: { toolName: block.name, error: message } })
    }
  }

  return results
}

function getEventTypeForTool(name: string): SSEEvent['type'] {
  switch (name) {
    case 'write_file': return 'file_write'
    case 'git_commit':
    case 'git_push': return 'git_op'
    case 'run_tests': return 'tool_output'
    default: return 'tool_output'
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/lib/__tests__/tool-executor.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add apps/agent/src/lib/tool-executor.ts apps/agent/src/lib/__tests__/tool-executor.test.ts
git commit -m "feat(agent): add tool executor with approval gating and SSE events"
```

---

### Task 3: Rewrite agent-loop.ts — Claude API integration

**Files:**
- Modify: `apps/agent/src/lib/agent-loop.ts`

This is the core rewrite. Replace the dummy echo with a real Claude tool-calling loop.

- [ ] **Step 1: Write the failing test**

Create `apps/agent/src/lib/__tests__/agent-loop.test.ts`:

```ts
import { describe, it, expect } from 'vitest'

describe('agent-loop', () => {
  it('exports runAgentTask', async () => {
    const mod = await import('../agent-loop.js')
    expect(mod.runAgentTask).toBeDefined()
    expect(mod.registerEmitter).toBeDefined()
    expect(mod.unregisterEmitter).toBeDefined()
  })
})
```

- [ ] **Step 2: Rewrite agent-loop.ts**

Complete rewrite. Keep the existing `registerEmitter`/`unregisterEmitter` exports. Replace `runAgentTask` internals:

```ts
import Anthropic from '@anthropic-ai/sdk'
import { eq } from 'drizzle-orm'
import { agentTasks } from '@scrumbs/db'
import type { SSEEvent, PersonaName } from '@scrumbs/types'
import { SSEEmitter } from './sse.js'
import { executeToolCalls } from './tool-executor.js'
import { getAllTools, type ToolContext } from './tools/index.js'
import { createWorkspace, validateWorkspacePath } from './workspace.js'
import { waitForApproval, resolveApproval } from './approval.js'
import { estimateTokens, maybeSummariseHistory } from './context-window.js'
import { checkConcurrencyLimit, checkTokenBudget, incrementTokensUsed, BudgetExceededError, ConcurrencyLimitError } from './cost-guard.js'
import { retryWithBackoff } from './retry.js'
import {
  buildPabloSystemPrompt,
  buildStellaSystemPrompt,
  buildViktorSystemPrompt,
  buildRexSystemPrompt,
  buildQuinnSystemPrompt,
  buildDexSystemPrompt,
  buildMaxSystemPrompt,
} from '@scrumbs/personas'

const anthropic = new Anthropic()

// Map persona name to system prompt builder
function buildSystemPrompt(persona: PersonaName, input: Record<string, unknown>): string {
  switch (persona) {
    case 'pablo': return buildPabloSystemPrompt(input as any)
    case 'stella': return buildStellaSystemPrompt(input as any)
    case 'viktor': return buildViktorSystemPrompt(input as any)
    case 'rex': return buildRexSystemPrompt(input as any)
    case 'quinn': return buildQuinnSystemPrompt(input as any)
    case 'dex': return buildDexSystemPrompt(input as any)
    case 'max': return buildMaxSystemPrompt()
    default: throw new Error(`Unknown persona: ${persona}`)
  }
}

// Determine which tools a persona can use
function getToolsForPersona(persona: PersonaName) {
  const all = getAllTools()
  // Conversational personas (pablo, stella for planning/retro) don't need filesystem tools
  if (persona === 'pablo' || persona === 'stella') return []
  // Rex reviews code but doesn't write it
  if (persona === 'rex') return all.filter(t => t.name === 'read_file' || t.name === 'bash')
  // Quinn runs tests
  if (persona === 'quinn') return all.filter(t => t.name === 'read_file' || t.name === 'run_tests' || t.name === 'bash')
  // Viktor, Dex, Max get all tools
  return all
}

// Convert tool definitions to Anthropic API format
function toolsToAnthropicFormat(tools: ReturnType<typeof getAllTools>) {
  return tools.map(t => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema as Anthropic.Tool['input_schema'],
  }))
}

const SSE_BUFFER_CLEANUP_DELAY_MS = 30_000

// --- Emitter management (unchanged) ---
const emitters = new Map<string, SSEEmitter>()

export function registerEmitter(taskId: string, emitter: SSEEmitter): void {
  emitters.set(taskId, emitter)
}

export function unregisterEmitter(taskId: string): void {
  emitters.delete(taskId)
}

// Check if task has been cancelled
async function isTaskCancelled(db: any, taskId: string): Promise<boolean> {
  const [task] = await db.select({ status: agentTasks.status }).from(agentTasks).where(eq(agentTasks.id, taskId)).limit(1)
  return task?.status === 'cancelled'
}

export async function runAgentTask(
  db: any,
  taskId: string,
  sessionId: string,
  personaName: PersonaName,
  input: Record<string, unknown>,
  userId: string,
) {
  const emit = (event: SSEEvent) => {
    const emitter = emitters.get(taskId)
    if (emitter) emitter.emit(event)
  }

  try {
    // Cost guard checks
    await checkConcurrencyLimit(db, userId)

    // Update task to running
    await db.update(agentTasks).set({ status: 'running', startedAt: new Date() }).where(eq(agentTasks.id, taskId))

    // Build system prompt and tools
    const systemPrompt = buildSystemPrompt(personaName, input)
    const personaTools = getToolsForPersona(personaName)
    const anthropicTools = toolsToAnthropicFormat(personaTools)

    // Set up workspace for tool-using personas
    let workspace: Awaited<ReturnType<typeof createWorkspace>> | null = null
    let toolContext: ToolContext | null = null

    if (personaTools.length > 0 && input.githubRepo && input.githubToken) {
      workspace = await createWorkspace(
        taskId,
        input.githubRepo as string,
        input.githubToken as string,
      )
      toolContext = {
        workspaceDir: workspace.dir,
        env: workspace.cleanEnv,
        gitEnv: workspace.gitEnv,
        taskId,
      }
    } else if (personaTools.length > 0) {
      // Tools available but no repo — provide a minimal context
      const { tmpdir } = await import('node:os')
      const path = await import('node:path')
      const fs = await import('node:fs/promises')
      const dir = path.join(tmpdir(), 'scrumbs', taskId)
      await fs.mkdir(dir, { recursive: true })
      toolContext = {
        workspaceDir: dir,
        env: { ...process.env },
        gitEnv: { ...process.env },
        taskId,
      }
    }

    // Build initial messages
    const userMessage = typeof input.rawRequirements === 'string'
      ? input.rawRequirements
      : typeof input.userMessage === 'string'
        ? input.userMessage
        : `Begin your task. Here is your input:\n\n${JSON.stringify(input, null, 2)}`

    let messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userMessage },
    ]

    // Main agent loop
    let totalInputTokens = 0
    let totalOutputTokens = 0

    while (true) {
      // Check cancellation
      if (await isTaskCancelled(db, taskId)) {
        emit({ type: 'done', payload: { cancelled: true } })
        break
      }

      // Check token budget
      await checkTokenBudget(db, taskId)

      // Call Claude with retry
      const apiParams: Anthropic.MessageCreateParams = {
        model: 'claude-sonnet-4-6',
        max_tokens: 8192,
        system: systemPrompt,
        messages,
        ...(anthropicTools.length > 0 ? { tools: anthropicTools } : {}),
      }

      const response = await retryWithBackoff(
        () => anthropic.messages.create(apiParams),
        (attempt) => emit({ type: 'retry', payload: { attempt, maxRetries: 3 } }),
      )

      // Track token usage
      totalInputTokens += response.usage.input_tokens
      totalOutputTokens += response.usage.output_tokens
      await incrementTokensUsed(db, taskId, response.usage.input_tokens + response.usage.output_tokens)

      // Process response content blocks
      const textBlocks: string[] = []
      const toolUseBlocks: Array<{ type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }> = []

      for (const block of response.content) {
        if (block.type === 'text') {
          textBlocks.push(block.text)
          emit({ type: 'message', payload: { message: block.text, persona: personaName } })
        } else if (block.type === 'tool_use') {
          toolUseBlocks.push(block as any)
        }
      }

      // If stop_reason is end_turn and no tool calls, we're done
      if (response.stop_reason === 'end_turn' && toolUseBlocks.length === 0) {
        // Task complete
        await db.update(agentTasks).set({
          status: 'completed',
          completedAt: new Date(),
          output: { summary: textBlocks.join('\n'), totalInputTokens, totalOutputTokens },
        }).where(eq(agentTasks.id, taskId))

        emit({ type: 'done', payload: { summary: textBlocks.join('\n') } })
        break
      }

      // Execute tool calls
      if (toolUseBlocks.length > 0 && toolContext) {
        const toolResults = await executeToolCalls(toolUseBlocks, toolContext, emit)

        // Add assistant response and tool results to messages
        messages.push({ role: 'assistant', content: response.content })
        messages.push({
          role: 'user',
          content: toolResults.map(r => ({
            type: 'tool_result' as const,
            tool_use_id: r.tool_use_id,
            content: r.content,
            ...(r.is_error ? { is_error: true } : {}),
          })),
        })
      } else if (toolUseBlocks.length > 0 && !toolContext) {
        // Tools requested but no context — return error
        messages.push({ role: 'assistant', content: response.content })
        messages.push({
          role: 'user',
          content: toolUseBlocks.map(b => ({
            type: 'tool_result' as const,
            tool_use_id: b.id,
            content: 'Error: No workspace available for tool execution.',
            is_error: true,
          })),
        })
      } else {
        // No tool calls but stop_reason wasn't end_turn — add response and continue
        messages.push({ role: 'assistant', content: response.content })
        messages.push({ role: 'user', content: 'Continue.' })
      }

      // Context window management
      messages = await maybeSummariseHistory(messages)
    }

    // Cleanup workspace
    if (workspace) {
      await workspace.cleanup().catch(() => {})
    }

  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    if (err instanceof BudgetExceededError) {
      await db.update(agentTasks).set({ status: 'cancelled', error: 'Token budget exceeded', completedAt: new Date() }).where(eq(agentTasks.id, taskId))
      emit({ type: 'error', payload: { error: 'Token budget exceeded' } })
    } else if (err instanceof ConcurrencyLimitError) {
      await db.update(agentTasks).set({ status: 'failed', error: 'Concurrency limit reached', completedAt: new Date() }).where(eq(agentTasks.id, taskId))
      emit({ type: 'error', payload: { error: 'Too many concurrent tasks. Please wait for one to complete.' } })
    } else {
      await db.update(agentTasks).set({ status: 'failed', error: message, completedAt: new Date() }).where(eq(agentTasks.id, taskId))
      emit({ type: 'error', payload: { error: message } })
    }

    emit({ type: 'done', payload: { error: message } })
  } finally {
    // Clean up SSE buffer after delay
    setTimeout(() => {
      SSEEmitter.clearBuffer(sessionId)
    }, SSE_BUFFER_CLEANUP_DELAY_MS)
  }
}
```

Key changes from dummy:
- Imports and initialises Anthropic SDK client
- Selects persona system prompt builder based on `personaName`
- Determines available tools per persona
- Creates workspace for tool-using personas
- Runs a while(true) loop calling `anthropic.messages.create()`
- Processes text blocks → emits `message` SSE events
- Processes tool_use blocks → calls `executeToolCalls()` → adds results to messages
- Handles cancellation checks, token budget, context summarisation
- Cleans up workspace on completion

- [ ] **Step 3: Update routes/tasks.ts to pass userId**

The route handler currently doesn't pass `userId` to `runAgentTask`. Update the POST handler to pass it:

```ts
// In the POST /tasks handler, after inserting the task:
runAgentTask(db, task.id, task.sessionId, body.personaName, body.input, body.userId)
```

Ensure the request body schema includes `userId: z.string()`.

- [ ] **Step 4: Run tests**

```bash
cd /home/alec/scrumbs && npx vitest run
```

Verify existing tests still pass, new agent-loop test passes.

- [ ] **Step 5: Build check**

```bash
npm run build -w packages/types && npm run build -w packages/db && npm run build -w packages/personas && npm run build -w apps/agent
```

- [ ] **Step 6: Commit**

```bash
git add apps/agent/src/lib/agent-loop.ts apps/agent/src/routes/tasks.ts apps/agent/src/lib/__tests__/agent-loop.test.ts
git commit -m "feat(agent): rewrite agent loop with Claude API, persona selection, and tool execution"
```

---

### Task 4: Create web API route for task creation

**Files:**
- Create: `apps/web/app/api/projects/[projectId]/tasks/route.ts`

This route allows the web frontend to create an agent task. It validates ownership, calls the agent service, and returns the task ID + session ID for SSE connection.

- [ ] **Step 1: Implement the route**

```ts
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createDb } from '@scrumbs/db'
import { projects } from '@scrumbs/db'
import { eq, and } from 'drizzle-orm'
import { createAgentTask } from '@/lib/agent-client'

const db = createDb(process.env.DATABASE_URL!)

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  // Verify project ownership
  const [project] = await db.select().from(projects).where(
    and(eq(projects.id, projectId), eq(projects.userId, session.user.id))
  ).limit(1)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { personaName, sprintId, input } = body

  // Create task via agent service
  const result = await createAgentTask({
    personaName,
    sprintId: sprintId ?? null,
    userId: session.user.id,
    input: {
      ...input,
      projectName: project.name,
      githubRepo: `${project.githubOwner}/${project.githubRepo}`,
    },
  })

  return NextResponse.json(result, { status: 202 })
}
```

- [ ] **Step 2: Update agent-client.ts to accept userId**

Add `userId` to the task creation params in `apps/web/lib/agent-client.ts`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/api/projects/[projectId]/tasks/route.ts apps/web/lib/agent-client.ts
git commit -m "feat(web): add task creation API route with ownership verification"
```

---

## Chunk 1 Verification Checkpoint

After completing Tasks 1-4:
- [ ] Agent service builds and starts
- [ ] Tools are registered (6 tools in registry)
- [ ] Agent loop can be triggered via POST /tasks
- [ ] Claude API is called with correct persona system prompt
- [ ] Tool calls are executed and results returned to Claude
- [ ] SSE events are emitted for text, tool calls, and tool results
- [ ] Task completion updates DB status
- [ ] All existing tests pass

---

## Chunk 2: Pre-Sprint Flow — Pablo (Tasks 5-7)

Wire the Requirements and PRD pages to create agent tasks and display results.

### Task 5: Create reusable StageWorkspace component

**Files:**
- Create: `apps/web/components/stage-workspace.tsx`

A client component that manages the full agent interaction lifecycle: start task, SSE stream, conversation display, artifact display, approval.

- [ ] **Step 1: Implement stage-workspace.tsx**

```tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { SSEEvent, PersonaName } from '@scrumbs/types'
import { PersonaMessage } from './persona-message'
import { HandoffCard } from './handoff-card'

interface StageWorkspaceProps {
  projectId: string
  sprintId?: string
  personaName: PersonaName
  stage: string
  input: Record<string, unknown>
  agentServiceUrl: string
  fromPersona?: PersonaName // for handoff animation
  onComplete?: (output: any) => void
  onArtifact?: (content: string) => void
  artifactContent?: string
  artifactTitle?: string
}

export function StageWorkspace({
  projectId,
  sprintId,
  personaName,
  stage,
  input,
  agentServiceUrl,
  fromPersona,
  onComplete,
  onArtifact,
  artifactContent,
  artifactTitle,
}: StageWorkspaceProps) {
  const [messages, setMessages] = useState<SSEEvent[]>([])
  const [taskId, setTaskId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)
  const [done, setDone] = useState(false)
  const [started, setStarted] = useState(false)
  const [showHandoff, setShowHandoff] = useState(!!fromPersona)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Start the agent task
  const startTask = useCallback(async () => {
    try {
      setStarted(true)
      setError(null)
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personaName, sprintId, input }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error || 'Failed to start task')
        return
      }
      const data = await res.json()
      setTaskId(data.taskId)
      setSessionId(data.sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start task')
    }
  }, [projectId, personaName, sprintId, input])

  // Connect to SSE when we have a taskId
  useEffect(() => {
    if (!taskId || !sessionId) return

    const url = `${agentServiceUrl}/tasks/${taskId}/stream?sessionId=${sessionId}`
    const es = new EventSource(url)

    es.onopen = () => setConnected(true)

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as SSEEvent
        setMessages((prev) => [...prev, event])

        if (event.type === 'done') {
          setDone(true)
          es.close()
          onComplete?.(event.payload)
        }
      } catch (err) {
        console.error('[StageWorkspace] Failed to parse SSE event:', e.data, err)
      }
    }

    es.onerror = () => setConnected(false)

    return () => es.close()
  }, [taskId, sessionId, agentServiceUrl, onComplete])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Extract latest artifact from messages (message type with content that looks like markdown)
  useEffect(() => {
    const lastMessage = [...messages].reverse().find(
      e => e.type === 'message' && typeof (e.payload as any)?.message === 'string'
    )
    if (lastMessage && onArtifact) {
      const content = (lastMessage.payload as any).message
      // Simple heuristic: if content has headers, it's likely an artifact
      if (content.includes('##') || content.includes('# ')) {
        onArtifact(content)
      }
    }
  }, [messages, onArtifact])

  return (
    <div className="flex h-full">
      {/* Handoff animation */}
      {showHandoff && fromPersona && (
        <HandoffCard
          from={fromPersona}
          to={personaName}
          onComplete={() => {
            setShowHandoff(false)
            startTask()
          }}
        />
      )}

      {/* Left panel: Conversation */}
      <div className="flex-1 flex flex-col border-r">
        <div className="flex items-center gap-2 p-3 border-b">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : done ? 'bg-slate-400' : 'bg-amber-400'}`} />
          <span className="text-sm font-medium capitalize">{personaName}</span>
          {done && <span className="text-xs text-slate-500">· Complete</span>}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!started && !showHandoff && (
            <button
              onClick={startTask}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Start with {personaName.charAt(0).toUpperCase() + personaName.slice(1)}
            </button>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          {messages
            .filter(e => e.type === 'message' || e.type === 'approval_required')
            .map((event, i) => (
              <PersonaMessage
                key={i}
                personaName={personaName}
                content={
                  typeof (event.payload as any)?.message === 'string'
                    ? (event.payload as any).message
                    : JSON.stringify(event.payload)
                }
                requiresApproval={event.type === 'approval_required'}
                taskId={taskId!}
              />
            ))}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Right panel: Artifact */}
      <div className="w-[40%] flex flex-col">
        <div className="p-3 border-b">
          <span className="text-sm font-medium">{artifactTitle || 'Artifact'}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {artifactContent ? (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap">
              {artifactContent}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Waiting for {personaName}…</p>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/components/stage-workspace.tsx
git commit -m "feat(web): add reusable StageWorkspace component for agent interaction"
```

---

### Task 6: Wire Requirements page

**Files:**
- Modify: `apps/web/app/projects/[projectId]/requirements/page.tsx`

- [ ] **Step 1: Rewrite requirements page**

Replace the shell with a server component that renders StageWorkspace:

```tsx
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { StageWorkspace } from '@/components/stage-workspace'

export default async function RequirementsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const { projectId } = await params

  return (
    <div className="h-full">
      <RequirementsClient
        projectId={projectId}
        agentServiceUrl={process.env.AGENT_SERVICE_URL!}
      />
    </div>
  )
}

// Client wrapper to pass server-only env vars
'use client'

function RequirementsClient({ projectId, agentServiceUrl }: { projectId: string; agentServiceUrl: string }) {
  const [artifact, setArtifact] = useState<string | null>(null)

  return (
    <StageWorkspace
      projectId={projectId}
      personaName="pablo"
      stage="requirements"
      input={{ stage: 'requirements' }}
      agentServiceUrl={agentServiceUrl}
      artifactTitle="Requirements"
      artifactContent={artifact ?? undefined}
      onArtifact={setArtifact}
    />
  )
}
```

Note: Due to Next.js server/client boundary, we need to split into a server component that provides env vars and a client component that uses StageWorkspace. The exact pattern will need the `agentServiceUrl` passed via a config endpoint or embedded in the page as a prop.

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/projects/[projectId]/requirements/page.tsx
git commit -m "feat(web): wire requirements page to agent via StageWorkspace"
```

---

### Task 7: Wire PRD page

**Files:**
- Modify: `apps/web/app/projects/[projectId]/prd/page.tsx`

Same pattern as requirements but with `stage: 'prd'` and existing requirements passed as context.

- [ ] **Step 1: Rewrite PRD page**

Similar to requirements, but fetch the existing requirements artifact from DB and pass as `existingRequirements` in the input.

- [ ] **Step 2: Commit**

```bash
git add apps/web/app/projects/[projectId]/prd/page.tsx
git commit -m "feat(web): wire PRD page to agent with requirements context"
```

---

## Chunk 2 Verification Checkpoint

- [ ] Requirements page loads and shows "Start with Pablo" button
- [ ] Clicking start creates an agent task and connects SSE
- [ ] Pablo's messages stream in the conversation panel
- [ ] Pablo generates a requirements document
- [ ] PRD page loads with existing requirements as context
- [ ] Pablo generates a PRD in conversation

---

## Chunk 3: Sprint Planning — Stella + Branch Creation (Tasks 8-10)

### Task 8: Wire planning page

**Files:**
- Modify: `apps/web/app/projects/[projectId]/sprints/[sprintId]/planning/page.tsx`

- [ ] **Step 1: Rewrite planning page to use StageWorkspace with Stella**

Pass PRD content and carry-forward stories in the input. On completion, create Story records in DB from the sprint plan.

- [ ] **Step 2: Commit**

---

### Task 9: Add sprint approval API route with branch creation

**Files:**
- Create: `apps/web/app/api/sprints/[sprintId]/approve-stage/route.ts`

- [ ] **Step 1: Implement approve-stage route**

This route:
1. Validates sprint ownership
2. Reads current sprint status and determines the approval action
3. For `planning → development`: creates GitHub branch via Octokit, updates sprint.featureBranch
4. For `review → qa`: checks no critical findings
5. For `qa → deploying`: checks all tests pass
6. Advances sprint status using assertValidTransition
7. Creates Artifact record with approved content

- [ ] **Step 2: Commit**

---

### Task 10: Create Story records from sprint plan

**Files:**
- Modify: `apps/web/app/api/sprints/[sprintId]/approve-stage/route.ts`

- [ ] **Step 1: Parse stories from Stella's sprint plan output and insert into DB**

When approving the planning stage, extract stories from the sprint plan (Stella outputs structured stories), create Story records in the DB.

- [ ] **Step 2: Commit**

---

## Chunk 3 Verification Checkpoint

- [ ] Planning page shows Stella conversation
- [ ] Stella generates sprint plan with stories
- [ ] Approving creates Story records in DB
- [ ] Feature branch created on GitHub
- [ ] Sprint status advances to 'development'

---

## Chunk 4: Development — Viktor + Terminal (Tasks 11-13)

### Task 11: Wire development page with terminal panel

**Files:**
- Modify: `apps/web/app/projects/[projectId]/sprints/[sprintId]/development/page.tsx`

- [ ] **Step 1: Rewrite to use TerminalPanel with live SSE connection**

Create Viktor agent task on page load (or via start button). Wire TerminalPanel to the task's SSE stream. Wire KanbanStrip with onStoryStatus callback.

- [ ] **Step 2: Commit**

---

### Task 12: Handle story_status events in development page

**Files:**
- Modify: `apps/web/app/projects/[projectId]/sprints/[sprintId]/development/page.tsx`
- Modify: `apps/web/components/kanban-strip.tsx`

- [ ] **Step 1: When TerminalPanel receives story_status events, update local kanban state and PATCH the story status via API**

- [ ] **Step 2: Commit**

---

### Task 13: Add Max handoff before Viktor

**Files:**
- Modify: `apps/web/app/projects/[projectId]/sprints/[sprintId]/development/page.tsx`

- [ ] **Step 1: Show brief Max handoff card ("Branch ready. Viktor, you're up.") before starting Viktor's task**

- [ ] **Step 2: Commit**

---

## Chunk 4 Verification Checkpoint

- [ ] Development page shows Max handoff then Viktor's terminal
- [ ] Viktor's tool calls stream in terminal panel
- [ ] Approval gates pause and show approve/reject buttons
- [ ] Kanban strip updates as Viktor progresses stories
- [ ] Story status persisted to DB via PATCH API

---

## Chunk 5: Sprint Completion — Rex, Quinn, Dex, Retro (Tasks 14-18)

### Task 14: Wire review page — Rex + PR creation

**Files:**
- Modify: `apps/web/app/projects/[projectId]/sprints/[sprintId]/review/page.tsx`
- Modify: `apps/web/app/api/sprints/[sprintId]/approve-stage/route.ts`

- [ ] **Step 1: Create PR via Octokit when entering review stage (or in approve-stage route for development → review)**

- [ ] **Step 2: Wire review page to create Rex agent task with PR diff as input**

- [ ] **Step 3: Display review findings with severity badges**

- [ ] **Step 4: Commit**

---

### Task 15: Wire QA page — Quinn

**Files:**
- Modify: `apps/web/app/projects/[projectId]/sprints/[sprintId]/qa/page.tsx`

- [ ] **Step 1: Wire to create Quinn agent task. Show terminal panel for test execution. Display QA report in artifact panel.**

- [ ] **Step 2: Commit**

---

### Task 16: Wire deploy page — Dex

**Files:**
- Modify: `apps/web/app/projects/[projectId]/sprints/[sprintId]/deploy/page.tsx`

- [ ] **Step 1: Wire to create Dex agent task. Show terminal panel for CI/CD status. Display deploy log. Require approval for production deploy.**

- [ ] **Step 2: Commit**

---

### Task 17: Wire retro page — Stella retro conversation

**Files:**
- Modify: `apps/web/app/projects/[projectId]/sprints/[sprintId]/retro/page.tsx`

- [ ] **Step 1: Wire to create Stella retro agent task. Show conversation panel. Display retro artifact. Keep existing "Start Sprint N+1" button.**

- [ ] **Step 2: Commit**

---

### Task 18: Add artifact creation to approve-stage route

**Files:**
- Modify: `apps/web/app/api/sprints/[sprintId]/approve-stage/route.ts`

- [ ] **Step 1: On stage approval, create Artifact record with type matching the stage, status 'active'. For step-back, mark previous artifacts as 'superseded'.**

- [ ] **Step 2: Commit**

---

## Chunk 5 Verification Checkpoint

- [ ] Review page creates PR and shows Rex's findings
- [ ] QA page runs tests and shows Quinn's report
- [ ] Deploy page triggers CI/CD and shows Dex's progress
- [ ] Retro page shows Stella conversation and retro artifact
- [ ] "Start Sprint N+1" still works and carries forward stories
- [ ] Artifacts created for each stage on approval

---

## Chunk 6: Cross-Cutting + Polish (Tasks 19-23)

### Task 19: Project creation — GitHub repo validation

**Files:**
- Modify: `apps/web/app/api/projects/route.ts`

- [ ] **Step 1: Before creating project, validate GitHub repo exists and user has write access via Octokit**

- [ ] **Step 2: Add unique (userId, githubRepo) check at API layer**

- [ ] **Step 3: Commit**

---

### Task 20: Returning user flow — guard against concurrent sprints

**Files:**
- Modify: `apps/web/app/api/projects/[projectId]/sprints/route.ts`

- [ ] **Step 1: In POST handler, check if any sprint for this project has status !== 'complete'. If so, return 409 with the active sprint ID.**

- [ ] **Step 2: Commit**

---

### Task 21: Step-back with artifact superseding

**Files:**
- Create: `apps/web/app/api/sprints/[sprintId]/step-back/route.ts`

- [ ] **Step 1: Implement step-back route that validates transition, marks current stage artifacts as 'superseded', and reverts sprint status**

- [ ] **Step 2: Commit**

---

### Task 22: Token budget UX — 80% warning

**Files:**
- Modify: `apps/agent/src/lib/agent-loop.ts`
- Modify: `apps/web/components/terminal-panel.tsx`

- [ ] **Step 1: In agent loop, after each iteration check if token usage > 80% of budget. If so, emit a budget_warning SSE event.**

- [ ] **Step 2: In terminal panel, render budget warnings with amber styling.**

- [ ] **Step 3: Commit**

---

### Task 23: Auto-reconnect on page load

**Files:**
- Modify: `apps/web/components/stage-workspace.tsx`

- [ ] **Step 1: On mount, check if there's a running agent task for this project/sprint/stage by querying the API. If found, connect to its SSE stream instead of showing the start button.**

- [ ] **Step 2: Commit**

---

## Chunk 6 Verification Checkpoint

- [ ] Creating a project with invalid repo shows error
- [ ] Cannot create new sprint while one is in progress
- [ ] Step-back marks artifacts as superseded and reverts status
- [ ] Token budget warning appears at 80%
- [ ] Page reload reconnects to running agent task

---

## Final Verification

- [ ] Full build passes: `npm run build` across all packages
- [ ] All tests pass: `npx vitest run`
- [ ] New project → Requirements (Pablo) → PRD (Pablo) → Sprint Planning (Stella) → Development (Viktor) → Review (Rex) → QA (Quinn) → Deploy (Dex) → Retro (Stella) → Sprint 2 works end-to-end
- [ ] Railway deploy succeeds for both web and agent services
