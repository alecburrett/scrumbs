import { auth } from '@/auth'
import { getProjectById } from '@/lib/services/projects'
import { createSprint } from '@/lib/services/sprints'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  const project = await getProjectById(body.projectId, session.user.id)
  if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const sprint = await createSprint({ projectId: body.projectId })
  return NextResponse.json(sprint, { status: 201 })
}
