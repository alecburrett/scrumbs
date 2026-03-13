import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { sprints, projects, stories, artifacts, accounts } from '@scrumbs/db'
import { eq, and } from 'drizzle-orm'
import { assertValidTransition, TransitionError } from '@/lib/sprint-state-machine'
import { createOctokit } from '@/lib/github'
import type { SprintStatus } from '@scrumbs/types'
import type { ArtifactType } from '@scrumbs/types'
import { getSprintIfOwned } from '@/lib/ownership'

interface ApproveBody {
  artifactContent?: string
  artifactType?: ArtifactType
  stories?: Array<{ title: string; description?: string; points?: number }>
  agentTaskId?: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sprintId: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { sprintId } = await params
  const sprint = await getSprintIfOwned(sprintId, session.user.id)
  if (!sprint) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = (await req.json()) as ApproveBody

  // Get the project for GitHub info
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, sprint.projectId))
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  const currentStatus = sprint.status as SprintStatus

  // Determine next status and perform transition-specific actions
  let nextStatus: SprintStatus | null = null

  try {
    switch (currentStatus) {
      case 'planning': {
        nextStatus = 'development'
        assertValidTransition(currentStatus, nextStatus, 'approve-stage')

        // Get GitHub token
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

        const octokit = createOctokit(account.access_token)
        const owner = project.githubOwner
        const repo = project.githubRepo

        // Get default branch
        const { data: repoData } = await octokit.rest.repos.get({
          owner,
          repo,
        })
        const defaultBranch = repoData.default_branch

        // Create feature branch
        const branchName = `sprint-${sprint.number}-${slugify(
          `sprint-${sprint.number}`
        )}`
        const { data: ref } = await octokit.rest.git.getRef({
          owner,
          repo,
          ref: `heads/${defaultBranch}`,
        })
        await octokit.rest.git.createRef({
          owner,
          repo,
          ref: `refs/heads/${branchName}`,
          sha: ref.object.sha,
        })

        // Update sprint with feature branch
        await db
          .update(sprints)
          .set({ featureBranch: branchName })
          .where(eq(sprints.id, sprintId))

        // Create Story records from stories array
        if (body.stories && body.stories.length > 0) {
          await db.insert(stories).values(
            body.stories.map((s, i) => ({
              sprintId,
              title: s.title,
              description: s.description ?? null,
              order: i,
              status: 'todo' as const,
            }))
          )
        }

        break
      }

      case 'development': {
        nextStatus = 'review'
        assertValidTransition(currentStatus, nextStatus, 'approve-stage')

        // Get GitHub token
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

        const octokit = createOctokit(account.access_token)
        const owner = project.githubOwner
        const repo = project.githubRepo

        // Get default branch
        const { data: repoData } = await octokit.rest.repos.get({
          owner,
          repo,
        })

        // Create PR
        const { data: pr } = await octokit.rest.pulls.create({
          owner,
          repo,
          title: `Sprint ${sprint.number}`,
          head: sprint.featureBranch!,
          base: repoData.default_branch,
        })

        // prUrl not in schema, but we can store it; for now just advance status
        // If prUrl column exists in future, update it here
        void pr

        break
      }

      case 'review': {
        nextStatus = 'qa'
        assertValidTransition(currentStatus, nextStatus, 'approve-stage')
        break
      }

      case 'qa': {
        nextStatus = 'deploying'
        assertValidTransition(currentStatus, nextStatus, 'approve-stage')
        break
      }

      case 'deploying': {
        nextStatus = 'complete'
        assertValidTransition(currentStatus, nextStatus, 'approve-stage')
        break
      }

      default:
        return NextResponse.json(
          { error: `Cannot approve from status: ${currentStatus}` },
          { status: 400 }
        )
    }
  } catch (err) {
    if (err instanceof TransitionError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    throw err
  }

  // Create artifact after transition is validated
  if (body.artifactContent && body.artifactType && body.agentTaskId) {
    await db.insert(artifacts).values({
      agentTaskId: body.agentTaskId,
      sprintId,
      type: body.artifactType,
      contentMd: body.artifactContent,
      status: 'active',
    })
  }

  // Advance sprint status
  const updateData: Record<string, unknown> = { status: nextStatus }
  if (nextStatus === 'complete') {
    updateData.completedAt = new Date()
  }

  const [updated] = await db
    .update(sprints)
    .set(updateData)
    .where(eq(sprints.id, sprintId))
    .returning()

  return NextResponse.json(updated)
}
