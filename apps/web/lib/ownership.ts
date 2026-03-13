import { db } from '@/lib/db'
import { sprints, projects, stories, agentTasks } from '@scrumbs/db'
import { eq, and } from 'drizzle-orm'

export async function getSprintIfOwned(sprintId: string, userId: string) {
  const [result] = await db
    .select({
      id: sprints.id,
      projectId: sprints.projectId,
      number: sprints.number,
      status: sprints.status,
      featureBranch: sprints.featureBranch,
      createdAt: sprints.createdAt,
      completedAt: sprints.completedAt,
    })
    .from(sprints)
    .innerJoin(projects, eq(sprints.projectId, projects.id))
    .where(and(eq(sprints.id, sprintId), eq(projects.userId, userId)))
  return result ?? null
}

export async function getStoryIfOwned(storyId: string, sprintId: string, userId: string) {
  const [result] = await db
    .select({
      id: stories.id,
      sprintId: stories.sprintId,
      title: stories.title,
      status: stories.status,
    })
    .from(stories)
    .innerJoin(sprints, eq(stories.sprintId, sprints.id))
    .innerJoin(projects, eq(sprints.projectId, projects.id))
    .where(and(
      eq(stories.id, storyId),
      eq(stories.sprintId, sprintId),
      eq(projects.userId, userId),
    ))
  return result ?? null
}

export async function getTaskIfOwned(taskId: string, userId: string) {
  const [result] = await db
    .select({ id: agentTasks.id, status: agentTasks.status })
    .from(agentTasks)
    .innerJoin(sprints, eq(agentTasks.sprintId, sprints.id))
    .innerJoin(projects, eq(sprints.projectId, projects.id))
    .where(and(eq(agentTasks.id, taskId), eq(projects.userId, userId)))
  return result ?? null
}
