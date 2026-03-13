import type Anthropic from '@anthropic-ai/sdk'
import type { SSEEvent } from '@scrumbs/types'
import { getTool } from './tools/index.js'
import type { ToolContext } from './tools/index.js'
import { waitForApproval } from './approval.js'

type EmitFn = (event: Omit<SSEEvent, 'taskId' | 'sessionId' | 'timestamp'>) => void

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
  emit: EmitFn,
  taskId: string,
  db: import('@scrumbs/db').Db
): Promise<ToolResultBlock[]> {
  const results: ToolResultBlock[] = []

  for (const block of toolUseBlocks) {
    const tool = getTool(block.name)

    if (!tool) {
      results.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: `Error: unknown tool "${block.name}"`,
        is_error: true,
      })
      continue
    }

    // Emit tool_call event before execution
    emit({
      type: 'tool_call',
      payload: {
        toolName: block.name,
        input: block.input,
        toolUseId: block.id,
      },
    })

    // Handle approval gate if required
    if (tool.requiresApproval) {
      const { agentTasks } = await import('@scrumbs/db')
      const { eq } = await import('drizzle-orm')

      const approvalPromise = waitForApproval(taskId)
      emit({
        type: 'approval_required',
        payload: {
          message: `Tool "${block.name}" requires approval before execution`,
          toolName: block.name,
          input: block.input,
          toolUseId: block.id,
        },
      })

      await db
        .update(agentTasks)
        .set({ status: 'waiting_approval' })
        .where(eq(agentTasks.id, taskId))

      const approved = await approvalPromise

      await db
        .update(agentTasks)
        .set({ status: 'running' })
        .where(eq(agentTasks.id, taskId))

      if (!approved) {
        results.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: 'Tool execution rejected by user',
          is_error: true,
        })
        continue
      }
    }

    // Execute the tool
    try {
      const output = await tool.execute(block.input, context)

      // Emit appropriate event based on tool name
      const eventType = inferEventType(block.name)
      emit({
        type: eventType,
        payload: {
          toolName: block.name,
          output,
          toolUseId: block.id,
        },
      })

      results.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: output,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)

      emit({
        type: 'error',
        payload: {
          toolName: block.name,
          error: message,
          toolUseId: block.id,
        },
      })

      results.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: `Error: ${message}`,
        is_error: true,
      })
    }
  }

  return results
}

/**
 * Infer the most appropriate SSE event type based on the tool name.
 */
function inferEventType(toolName: string): SSEEvent['type'] {
  if (toolName.startsWith('git_') || toolName === 'git_push' || toolName === 'git_commit') {
    return 'git_op'
  }
  if (toolName === 'write_file' || toolName === 'edit_file') {
    return 'file_write'
  }
  if (toolName === 'run_tests') {
    return 'tool_output'
  }
  return 'tool_output'
}
