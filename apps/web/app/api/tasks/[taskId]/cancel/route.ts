import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  const { taskId } = await params
  const session = await auth()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agentUrl = process.env.AGENT_SERVICE_URL
  const agentSecret = process.env.AGENT_SERVICE_SECRET
  if (!agentUrl || !agentSecret) {
    return NextResponse.json({ error: 'Agent service not configured' }, { status: 503 })
  }

  const res = await fetch(`${agentUrl}/tasks/${taskId}/cancel`, {
    method: 'POST',
    headers: { 'x-agent-secret': agentSecret },
  })

  if (!res.ok) return NextResponse.json({ error: 'Agent service error' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
