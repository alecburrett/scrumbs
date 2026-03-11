import { db, sprints } from '@scrumbs/db'
import { eq, desc } from 'drizzle-orm'

export async function getNextSprintNumber(projectId: string): Promise<number> {
  const rows = await db.select().from(sprints)
    .where(eq(sprints.projectId, projectId))
    .orderBy(desc(sprints.number))
    .limit(1)
  return rows.length === 0 ? 1 : rows[0].number + 1
}

export async function createSprint(input: { projectId: string; goal?: string }) {
  if (!input.projectId) throw new Error('projectId is required')
  const number = await getNextSprintNumber(input.projectId)
  const rows = await db.insert(sprints).values({
    projectId: input.projectId,
    number,
    goal: input.goal,
  }).returning()
  return rows[0]
}

export async function getSprintsByProject(projectId: string) {
  return db.select().from(sprints).where(eq(sprints.projectId, projectId))
}

export async function updateSprintStatus(id: string, status: typeof sprints.$inferSelect.status) {
  await db.update(sprints).set({ status }).where(eq(sprints.id, id))
}
