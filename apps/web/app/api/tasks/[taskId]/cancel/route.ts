import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getTaskIfOwned } from '@/lib/ownership'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { taskId } = await params
  const task = await getTaskIfOwned(taskId, session.user.id)
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const agentUrl = process.env.AGENT_SERVICE_URL
  const agentSecret = process.env.AGENT_SERVICE_SECRET
  if (!agentUrl || !agentSecret) {
    return NextResponse.json({ error: 'Agent service not configured' }, { status: 500 })
  }

  const res = await fetch(`${agentUrl}/tasks/${taskId}/cancel`, {
    method: 'POST',
    headers: { 'x-agent-secret': agentSecret },
  })

  return NextResponse.json(await res.json(), { status: res.status })
}
