import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { sprints, stories, projects, accounts } from '@scrumbs/db'
import { eq, and, inArray } from 'drizzle-orm'
import { getSprintIfOwned } from '@/lib/ownership'
import { createOctokit } from '@/lib/github'

interface RetroBody {
  retroContent?: string
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sprintId } = await params
  const currentSprint = await getSprintIfOwned(sprintId, session.user.id)
  if (!currentSprint) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (currentSprint.status !== 'complete') {
    return NextResponse.json(
      { error: 'Sprint must be complete before starting retro' },
      { status: 400 }
    )
  }

  const body = (await req.json().catch(() => ({}))) as RetroBody

  // Commit retro content to GitHub if available
  if (body.retroContent && currentSprint.featureBranch) {
    try {
      const [project] = await db
        .select()
        .from(projects)
        .where(eq(projects.id, currentSprint.projectId))

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

      if (project && account?.access_token) {
        const octokit = createOctokit(account.access_token)
        const content = Buffer.from(body.retroContent).toString('base64')
        await octokit.rest.repos.createOrUpdateFileContents({
          owner: project.githubOwner,
          repo: project.githubRepo,
          path: `sprints/sprint-${currentSprint.number}-retro.md`,
          message: `Add sprint ${currentSprint.number} retrospective`,
          content,
          branch: currentSprint.featureBranch,
        })
      }
    } catch {
      // Non-blocking: log but don't fail the retro
      console.error('Failed to commit retro to GitHub')
    }
  }

  // Calculate next sprint number safely
  const projectSprints = await db
    .select({ number: sprints.number })
    .from(sprints)
    .where(eq(sprints.projectId, currentSprint.projectId))
  const maxNumber = projectSprints.reduce((max, s) => Math.max(max, s.number), 0)

  // Create next sprint
  const [newSprint] = await db
    .insert(sprints)
    .values({
      projectId: currentSprint.projectId,
      number: maxNumber + 1,
      status: 'planning',
    })
    .returning()

  // Carry forward incomplete stories (todo AND in_progress)
  const incompleteStories = await db
    .select()
    .from(stories)
    .where(and(
      eq(stories.sprintId, sprintId),
      inArray(stories.status, ['todo', 'in_progress']),
    ))

  if (incompleteStories.length > 0) {
    await db.insert(stories).values(
      incompleteStories.map((s, i) => ({
        sprintId: newSprint.id,
        title: s.title,
        description: s.description,
        status: 'todo' as const,
        sortOrder: i,
      }))
    )
  }

  return NextResponse.json({ sprintId: newSprint.id }, { status: 201 })
}
