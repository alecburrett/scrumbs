import type { Db } from '@scrumbs/db'
import { agentTasks, sprints, projects } from '@scrumbs/db'
import { eq, and, inArray, sql } from 'drizzle-orm'

const MAX_CONCURRENT_PER_USER = 3

export class BudgetExceededError extends Error {
  constructor(taskId: string, budget: number, used: number) {
    super(`Task ${taskId} exceeded token budget: ${used}/${budget}`)
    this.name = 'BudgetExceededError'
  }
}

export class ConcurrencyLimitError extends Error {
  constructor(userId: string) {
    super(`User ${userId} has reached max concurrent tasks (${MAX_CONCURRENT_PER_USER})`)
    this.name = 'ConcurrencyLimitError'
  }
}

export async function checkConcurrencyLimit(
  db: Db,
  userId: string
): Promise<void> {
  const runningTasks = await db
    .select({ id: agentTasks.id })
    .from(agentTasks)
    .innerJoin(sprints, eq(agentTasks.sprintId, sprints.id))
    .innerJoin(projects, eq(sprints.projectId, projects.id))
    .where(
      and(
        inArray(agentTasks.status, ['running', 'waiting_approval']),
        eq(projects.userId, userId)
      )
    )

  if (runningTasks.length >= MAX_CONCURRENT_PER_USER) {
    throw new ConcurrencyLimitError(userId)
  }
}

export async function checkTokenBudget(
  db: Db,
  taskId: string,
  additionalTokens: number
): Promise<void> {
  const [task] = await db
    .select({ tokensBudget: agentTasks.tokensBudget, tokensUsed: agentTasks.tokensUsed })
    .from(agentTasks)
    .where(eq(agentTasks.id, taskId))

  if (!task) throw new Error(`Task ${taskId} not found`)

  if (task.tokensUsed + additionalTokens > task.tokensBudget) {
    throw new BudgetExceededError(taskId, task.tokensBudget, task.tokensUsed + additionalTokens)
  }
}

export async function incrementTokensUsed(
  db: Db,
  taskId: string,
  tokens: number
): Promise<void> {
  await db
    .update(agentTasks)
    .set({ tokensUsed: sql`${agentTasks.tokensUsed} + ${tokens}` })
    .where(eq(agentTasks.id, taskId))
}
