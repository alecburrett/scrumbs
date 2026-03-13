import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { projects } from '@scrumbs/db'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { name, githubOwner, githubRepo } = body

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
  }
  if (!githubOwner || !githubRepo) {
    return NextResponse.json({ error: 'GitHub owner and repo are required' }, { status: 400 })
  }

  const [project] = await db
    .insert(projects)
    .values({
      name: name.trim(),
      githubOwner,
      githubRepo,
      userId: session.user.id,
    })
    .returning()

  return NextResponse.json({ id: project.id }, { status: 201 })
}

export async function GET(_req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id))

  return NextResponse.json(userProjects)
}
