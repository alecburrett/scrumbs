import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { projects, artifacts, agentTasks } from '@scrumbs/db'
import { eq, and } from 'drizzle-orm'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const { type, contentMd, agentTaskId } = body

  if (!type || !contentMd || !agentTaskId) {
    return NextResponse.json({ error: 'type, contentMd, and agentTaskId are required' }, { status: 400 })
  }

  const validTypes = ['requirements', 'prd'] as const
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: `type must be one of: ${validTypes.join(', ')}` }, { status: 400 })
  }

  // Verify agentTaskId belongs to this project
  const [task] = await db
    .select({ id: agentTasks.id })
    .from(agentTasks)
    .where(and(eq(agentTasks.id, agentTaskId), eq(agentTasks.projectId, projectId)))
    .limit(1)
  if (!task) {
    return NextResponse.json({ error: 'Agent task not found for this project' }, { status: 400 })
  }

  // Mark any existing current artifact of this type as superseded
  await db
    .update(artifacts)
    .set({ status: 'superseded' })
    .where(
      and(
        eq(artifacts.projectId, projectId),
        eq(artifacts.type, type),
        eq(artifacts.status, 'current')
      )
    )

  // Create new artifact
  const [artifact] = await db
    .insert(artifacts)
    .values({
      projectId,
      agentTaskId,
      type,
      contentMd,
      status: 'current',
    })
    .returning()

  return NextResponse.json({ id: artifact.id }, { status: 201 })
}
