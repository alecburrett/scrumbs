import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { stories } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import type { StoryStatus } from '@scrumbs/types'
import { getStoryIfOwned } from '@/lib/ownership'

const VALID_STORY_STATUSES: StoryStatus[] = ['todo', 'in-progress', 'done']

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sprintId: string; storyId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sprintId, storyId } = await params
  const { status } = (await req.json()) as { status: StoryStatus }

  if (!VALID_STORY_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const story = await getStoryIfOwned(storyId, sprintId, session.user.id)
  if (!story) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [updated] = await db
    .update(stories)
    .set({ status })
    .where(eq(stories.id, storyId))
    .returning()

  return NextResponse.json(updated)
}
