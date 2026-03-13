import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { sprints, stories } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import { assertValidTransition } from '@/lib/sprint-state-machine'
import type { SprintStatus } from '@scrumbs/types'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const { sprintId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [sprint] = await db.select().from(sprints).where(eq(sprints.id, sprintId))
  if (!sprint) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const sprintStories = await db.select().from(stories).where(eq(stories.sprintId, sprintId))

  return NextResponse.json({ ...sprint, stories: sprintStories })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const { sprintId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { status } = body as { status: SprintStatus }

  const [sprint] = await db.select().from(sprints).where(eq(sprints.id, sprintId))
  if (!sprint) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  assertValidTransition(sprint.status as SprintStatus, status, 'api-patch')

  const [updated] = await db
    .update(sprints)
    .set({ status })
    .where(eq(sprints.id, sprintId))
    .returning()

  return NextResponse.json(updated)
}
