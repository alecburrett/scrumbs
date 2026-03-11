import { db, projects } from '@scrumbs/db'
import { eq } from 'drizzle-orm'

interface CreateProjectInput {
  userId: string
  name: string
  githubRepo: string
  description?: string
  defaultBranch?: string
}

export async function getProjectsByUser(userId: string) {
  return db.select().from(projects).where(eq(projects.userId, userId))
}

export async function getProjectById(id: string, userId: string) {
  const rows = await db.select().from(projects).where(eq(projects.id, id))
  const project = rows[0]
  if (!project || project.userId !== userId) return null
  return project
}

export async function createProject(input: CreateProjectInput) {
  if (!input.userId) throw new Error('userId is required')
  if (!input.name?.trim()) throw new Error('name is required')
  if (!/^[\w.-]+\/[\w.-]+$/.test(input.githubRepo))
    throw new Error('githubRepo must be in owner/repo format')

  const rows = await db.insert(projects).values({
    userId: input.userId,
    name: input.name.trim(),
    description: input.description,
    githubRepo: input.githubRepo,
    defaultBranch: input.defaultBranch ?? 'main',
  }).returning()

  return rows[0]
}

export async function archiveProject(id: string, userId: string) {
  const project = await getProjectById(id, userId)
  if (!project) throw new Error('Project not found')
  await db.update(projects).set({ status: 'archived', updatedAt: new Date() }).where(eq(projects.id, id))
}
