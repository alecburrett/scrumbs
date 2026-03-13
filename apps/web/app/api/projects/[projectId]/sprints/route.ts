import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { projects, sprints } from '@scrumbs/db'
import { eq, and } from 'drizzle-orm'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Get current sprint count
  const existingSprints = await db
    .select({ number: sprints.number })
    .from(sprints)
    .where(eq(sprints.projectId, projectId))

  const maxNumber = existingSprints.reduce((max, s) => Math.max(max, s.number), 0)
  const nextNumber = maxNumber + 1

  const [sprint] = await db
    .insert(sprints)
    .values({ projectId, number: nextNumber, status: 'planning' })
    .returning()

  return NextResponse.json(sprint, { status: 201 })
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const { projectId } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const sprintList = await db
    .select()
    .from(sprints)
    .where(eq(sprints.projectId, projectId))

  return NextResponse.json(sprintList)
}
