import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { sprints, stories, projects } from '@scrumbs/db'
import { eq, and } from 'drizzle-orm'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const { sprintId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch current sprint
  const [currentSprint] = await db.select().from(sprints).where(eq(sprints.id, sprintId))
  if (!currentSprint) return NextResponse.json({ error: 'Sprint not found' }, { status: 404 })

  if (currentSprint.status !== 'complete') {
    return NextResponse.json(
      { error: 'Sprint must be complete before starting a retro' },
      { status: 400 }
    )
  }

  // Get all sprints for the project to determine next sprint number
  const projectSprints = await db
    .select({ number: sprints.number })
    .from(sprints)
    .where(eq(sprints.projectId, currentSprint.projectId))

  const nextNumber = Math.max(...projectSprints.map((s) => s.number)) + 1

  // Create Sprint N+1
  const [newSprint] = await db
    .insert(sprints)
    .values({
      projectId: currentSprint.projectId,
      number: nextNumber,
      status: 'planning',
    })
    .returning()

  // Carry forward 'todo' stories from current sprint
  const todoStories = await db
    .select()
    .from(stories)
    .where(and(eq(stories.sprintId, sprintId), eq(stories.status, 'todo')))

  if (todoStories.length > 0) {
    await db.insert(stories).values(
      todoStories.map((s, i) => ({
        sprintId: newSprint.id,
        title: s.title,
        description: s.description,
        status: 'todo' as const,
        order: i,
      }))
    )
  }

  // Redirect to new sprint planning page
  return NextResponse.redirect(
    new URL(
      `/projects/${currentSprint.projectId}/sprints/${newSprint.id}/planning`,
      req.url
    )
  )
}
