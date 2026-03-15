import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { projects, agentTasks } from '@scrumbs/db'
import { eq, and } from 'drizzle-orm'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId, taskId } = await params

  // Verify project ownership
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const [task] = await db
    .select()
    .from(agentTasks)
    .where(and(eq(agentTasks.id, taskId), eq(agentTasks.projectId, projectId)))
    .limit(1)
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const outputJson = task.outputJson as { text?: string } | null

  return NextResponse.json({
    id: task.id,
    status: task.status,
    personaName: task.personaName,
    stage: task.stage,
    outputText: outputJson?.text ?? null,
    errorMessage: task.errorMessage,
  })
}
