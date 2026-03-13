import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/lib/db'
import { sprints, artifacts } from '@scrumbs/db'
import { eq, and } from 'drizzle-orm'
import {
  assertValidTransition,
  TransitionError,
  getPriorStage,
} from '@/lib/sprint-state-machine'
import type { SprintStatus } from '@scrumbs/types'
import { getSprintIfOwned } from '@/lib/ownership'

/** Map sprint status to the artifact type produced during that stage */
const STAGE_ARTIFACT_TYPE: Partial<Record<SprintStatus, string>> = {
  development: 'sprint-plan',
  review: 'code-review',
  qa: 'qa-report',
  deploying: 'deploy-log',
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

  const currentStatus = sprint.status as SprintStatus
  const priorStage = getPriorStage(currentStatus)

  if (!priorStage) {
    return NextResponse.json(
      { error: `Cannot step back from status: ${currentStatus}` },
      { status: 400 }
    )
  }

  try {
    assertValidTransition(currentStatus, priorStage, 'step-back')
  } catch (err) {
    if (err instanceof TransitionError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    throw err
  }

  // Mark current stage's active artifacts as superseded
  const artifactType = STAGE_ARTIFACT_TYPE[currentStatus]
  if (artifactType) {
    await db
      .update(artifacts)
      .set({ status: 'superseded' })
      .where(
        and(
          eq(artifacts.sprintId, sprintId),
          eq(artifacts.status, 'active'),
          eq(artifacts.type, artifactType as typeof artifacts.type.enumValues[number])
        )
      )
  }

  // Update sprint status to prior stage
  const [updated] = await db
    .update(sprints)
    .set({ status: priorStage })
    .where(eq(sprints.id, sprintId))
    .returning()

  return NextResponse.json(updated)
}
