import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { projects, agentTasks } from '@scrumbs/db'
import { eq, and, inArray } from 'drizzle-orm'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params

  // Verify project ownership
  const [project] = await db.select().from(projects).where(
    and(eq(projects.id, projectId), eq(projects.userId, session.user.id))
  ).limit(1)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Parse optional query params
  const sprintId = req.nextUrl.searchParams.get('sprintId')
  const personaName = req.nextUrl.searchParams.get('personaName')

  // Build conditions — agentTasks now has projectId directly
  const conditions = [
    eq(agentTasks.projectId, projectId),
    inArray(agentTasks.status, ['running', 'waiting_approval']),
  ]

  if (sprintId) {
    conditions.push(eq(agentTasks.sprintId, sprintId))
  }

  if (personaName) {
    // Cast to the enum type — the DB will reject invalid values
    conditions.push(eq(agentTasks.personaName, personaName as typeof agentTasks.personaName.enumValues[number]))
  }

  const [task] = await db.select({
    taskId: agentTasks.id,
    sessionId: agentTasks.sessionId,
  })
    .from(agentTasks)
    .where(and(...conditions))
    .limit(1)

  if (!task || !task.sessionId) {
    return NextResponse.json({ error: 'No active task' }, { status: 404 })
  }

  return NextResponse.json({ taskId: task.taskId, sessionId: task.sessionId })
}
