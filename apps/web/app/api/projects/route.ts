import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { projects, accounts } from '@scrumbs/db'
import { eq, and } from 'drizzle-orm'
import { createOctokit } from '@/lib/github'

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

  // Get GitHub token from accounts
  const [account] = await db
    .select()
    .from(accounts)
    .where(
      and(
        eq(accounts.userId, session.user.id),
        eq(accounts.provider, 'github')
      )
    )
    .limit(1)

  if (!account?.access_token) {
    return NextResponse.json(
      { error: 'GitHub account not linked' },
      { status: 400 }
    )
  }

  // Validate the repo exists and user has write access
  try {
    const octokit = createOctokit(account.access_token)
    const { data: repo } = await octokit.rest.repos.get({
      owner: githubOwner,
      repo: githubRepo,
    })
    if (!repo.permissions?.push) {
      return NextResponse.json(
        { error: 'You do not have write access to this repository' },
        { status: 403 }
      )
    }
  } catch {
    return NextResponse.json(
      { error: 'Repository not found or not accessible' },
      { status: 404 }
    )
  }

  // Check for unique (userId + githubOwner + githubRepo)
  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.userId, session.user.id),
        eq(projects.githubOwner, githubOwner),
        eq(projects.githubRepo, githubRepo)
      )
    )
    .limit(1)

  if (existing) {
    return NextResponse.json(
      { error: 'Project already exists for this repository', projectId: existing.id },
      { status: 409 }
    )
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
