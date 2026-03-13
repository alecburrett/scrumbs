import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { sprints, stories } from '@scrumbs/db'
import { eq, and, inArray } from 'drizzle-orm'
import { getSprintIfOwned } from '@/lib/ownership'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sprintId } = await params
  const currentSprint = await getSprintIfOwned(sprintId, session.user.id)
  if (!currentSprint) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (currentSprint.status !== 'complete') {
    return NextResponse.json(
      { error: 'Sprint must be complete before starting retro' },
      { status: 400 }
    )
  }

  // Calculate next sprint number safely
  const projectSprints = await db
    .select({ number: sprints.number })
    .from(sprints)
    .where(eq(sprints.projectId, currentSprint.projectId))
  const maxNumber = projectSprints.reduce((max, s) => Math.max(max, s.number), 0)

  // Create next sprint
  const [newSprint] = await db
    .insert(sprints)
    .values({
      projectId: currentSprint.projectId,
      number: maxNumber + 1,
      status: 'planning',
    })
    .returning()

  // Carry forward incomplete stories (todo AND in_progress)
  const incompleteStories = await db
    .select()
    .from(stories)
    .where(and(
      eq(stories.sprintId, sprintId),
      inArray(stories.status, ['todo', 'in_progress']),
    ))

  if (incompleteStories.length > 0) {
    await db.insert(stories).values(
      incompleteStories.map((s, i) => ({
        sprintId: newSprint.id,
        title: s.title,
        description: s.description,
        status: 'todo' as const,
        sortOrder: i,
      }))
    )
  }

  return NextResponse.json({ sprintId: newSprint.id }, { status: 201 })
}
