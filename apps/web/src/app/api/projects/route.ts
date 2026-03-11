import { auth } from '@/auth'
import { getProjectsByUser, createProject } from '@/lib/services/projects'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return NextResponse.json(await getProjectsByUser(session.user.id))
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await request.json()
    const project = await createProject({ userId: session.user.id, ...body })
    return NextResponse.json(project, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Error' }, { status: 400 })
  }
}
