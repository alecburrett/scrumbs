import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { projects, agentTasks } from '@scrumbs/db'
import { and, eq } from 'drizzle-orm'

/**
 * Server-side SSE proxy for agent task streams.
 * The agent service secret is added here and never exposed to the browser.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string; taskId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return new NextResponse('Unauthorized', { status: 401 })

  const { projectId, taskId } = await params
  const sessionId = req.nextUrl.searchParams.get('sessionId')
  if (!sessionId) return new NextResponse('sessionId required', { status: 400 })

  // Verify the user owns this project
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1)
  if (!project) return new NextResponse('Not found', { status: 404 })

  // Verify the task belongs to this project (prevents cross-project stream access)
  const [task] = await db
    .select({ id: agentTasks.id })
    .from(agentTasks)
    .where(and(eq(agentTasks.id, taskId), eq(agentTasks.projectId, projectId)))
    .limit(1)
  if (!task) return new NextResponse('Not found', { status: 404 })

  const agentServiceUrl = process.env.AGENT_SERVICE_URL
  const agentServiceSecret = process.env.AGENT_SERVICE_SECRET
  if (!agentServiceUrl) return new NextResponse('Agent service not configured', { status: 503 })

  const upstreamUrl = new URL(`${agentServiceUrl}/tasks/${taskId}/stream`)
  upstreamUrl.searchParams.set('sessionId', sessionId)
  if (agentServiceSecret) upstreamUrl.searchParams.set('secret', agentServiceSecret)

  const upstream = await fetch(upstreamUrl.toString(), {
    headers: { Accept: 'text/event-stream' },
    cache: 'no-store',
  })

  if (!upstream.ok || !upstream.body) {
    return new NextResponse('Upstream error', { status: upstream.status })
  }

  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
