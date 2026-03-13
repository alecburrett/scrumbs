import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { projects, accounts } from '@scrumbs/db'
import { eq, and } from 'drizzle-orm'
import { createAgentTask } from '@/lib/agent-client'

export async function POST(
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

  // Get GitHub token from accounts table
  const [account] = await db.select().from(accounts).where(
    and(eq(accounts.userId, session.user.id), eq(accounts.provider, 'github'))
  ).limit(1)

  const body = await req.json()
  const { personaName, sprintId, input } = body
  const stage = input?.stage as string | undefined

  if (!stage) {
    return NextResponse.json({ error: 'stage is required in input' }, { status: 400 })
  }

  const result = await createAgentTask({
    projectId,
    personaName,
    sprintId: sprintId ?? undefined,
    stage,
    userId: session.user.id,
    input: {
      ...input,
      projectId,
      projectName: project.name,
      githubRepo: `${project.githubOwner}/${project.githubRepo}`,
      ...(account?.access_token ? { githubToken: account.access_token } : {}),
    },
  })

  return NextResponse.json(result, { status: 202 })
}
