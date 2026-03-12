import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { stories } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import type { StoryStatus } from '@scrumbs/types'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ sprintId: string; storyId: string }> }
) {
  const { storyId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { status } = body as { status: StoryStatus }

  const [updated] = await db
    .update(stories)
    .set({ status })
    .where(eq(stories.id, storyId))
    .returning()

  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}
