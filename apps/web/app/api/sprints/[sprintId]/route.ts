import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { sprints, stories } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import { assertValidTransition, TransitionError } from '@/lib/sprint-state-machine'
import type { SprintStatus } from '@scrumbs/types'
import { getSprintIfOwned } from '@/lib/ownership'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sprintId } = await params
  const sprint = await getSprintIfOwned(sprintId, session.user.id)
  if (!sprint) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const sprintStories = await db
    .select()
    .from(stories)
    .where(eq(stories.sprintId, sprintId))
  return NextResponse.json({ ...sprint, stories: sprintStories })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sprintId } = await params
  const sprint = await getSprintIfOwned(sprintId, session.user.id)
  if (!sprint) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { status } = (await req.json()) as { status: SprintStatus }

  try {
    assertValidTransition(sprint.status as SprintStatus, status, 'api-patch')
  } catch (err) {
    if (err instanceof TransitionError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    throw err
  }

  const updateData: Record<string, unknown> = { status }
  if (status === 'complete') {
    updateData.completedAt = new Date()
  }

  const [updated] = await db
    .update(sprints)
    .set(updateData)
    .where(eq(sprints.id, sprintId))
    .returning()

  return NextResponse.json(updated)
}
