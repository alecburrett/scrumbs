import type { Db } from '@scrumbs/db'
import { agentTasks } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import { SSEEmitter } from './sse.js'
import { waitForApproval } from './approval.js'
import type { SSEEvent } from '@scrumbs/types'

const SSE_BUFFER_CLEANUP_DELAY_MS = 30_000

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

export async function runAgentTask(taskId: string, db: Db): Promise<void> {
  // Fetch task from DB
  const [task] = await db
    .select()
    .from(agentTasks)
    .where(eq(agentTasks.id, taskId))

  if (!task) throw new Error(`Task ${taskId} not found`)

  // Set status to running
  await db
    .update(agentTasks)
    .set({ status: 'running', updatedAt: new Date() })
    .where(eq(agentTasks.id, taskId))

  const sessionId = task.sessionId ?? taskId

  // Helper to get emitter (may arrive after task starts if SSE connection comes late)
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

  async function checkCancelled(): Promise<boolean> {
    if (await isTaskCancelled(db, taskId)) {
      await db.update(agentTasks).set({ status: 'cancelled' }).where(eq(agentTasks.id, taskId))
      emit({ type: 'done', payload: { cancelled: true } })
      return true
    }
    return false
  }

  try {
    // === DUMMY ECHO PERSONA ===
    // Steps 1 and 3 emit messages; step 2 requires approval (for testing the gate)

    // Step 1
    if (await checkCancelled()) return

    emit({ type: 'message', payload: 'Echo: step 1 — starting task' })
    await new Promise((r) => setTimeout(r, 500))

    // Step 2 — approval gate
    if (await checkCancelled()) return

    const approvalPromise = waitForApproval(taskId) // register gate FIRST
    emit({
      type: 'approval_required',
      payload: {
        message: 'Echo persona requests approval to proceed to step 2',
        toolName: 'echo_step_2',
      },
    })

    await db.update(agentTasks).set({ status: 'waiting_approval' }).where(eq(agentTasks.id, taskId))
    const approved = await approvalPromise // now wait
    await db.update(agentTasks).set({ status: 'running' }).where(eq(agentTasks.id, taskId))

    if (!approved) {
      emit({ type: 'message', payload: 'Echo: step 2 — rejected by user' })
      await db.update(agentTasks).set({ status: 'cancelled' }).where(eq(agentTasks.id, taskId))
      emit({ type: 'done', payload: { cancelled: true } })
      return
    }

    emit({ type: 'message', payload: 'Echo: step 2 — approved, continuing' })
    await new Promise((r) => setTimeout(r, 500))

    // Step 3
    if (await checkCancelled()) return

    emit({ type: 'message', payload: 'Echo: step 3 — task complete' })
    await new Promise((r) => setTimeout(r, 500))

    // Complete
    await db
      .update(agentTasks)
      .set({ status: 'completed', updatedAt: new Date() })
      .where(eq(agentTasks.id, taskId))

    emit({ type: 'done', payload: { success: true } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'

    await db
      .update(agentTasks)
      .set({ status: 'failed', errorMessage: message, updatedAt: new Date() })
      .where(eq(agentTasks.id, taskId))

    emit({ type: 'error', payload: { message } })
    emit({ type: 'done', payload: { success: false } })
  } finally {
    unregisterEmitter(taskId)
    setTimeout(() => SSEEmitter.clearBuffer(sessionId), SSE_BUFFER_CLEANUP_DELAY_MS)
  }
}
