import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const agentServiceUrl = process.env.AGENT_SERVICE_URL
  if (!agentServiceUrl) {
    return NextResponse.json({ error: 'Agent service not configured' }, { status: 503 })
  }

  // Do NOT expose AGENT_SERVICE_SECRET — use the /tasks/[taskId]/stream proxy instead
  return NextResponse.json({ agentServiceUrl })
}
