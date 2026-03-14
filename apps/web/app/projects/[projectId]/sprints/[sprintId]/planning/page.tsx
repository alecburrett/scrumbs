import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sprints, artifacts, stories } from '@scrumbs/db'
import { eq, and, desc, lt, inArray } from 'drizzle-orm'
import { PlanningClient } from './client'

export default async function SprintPlanningPage({
  params,
}: {
  params: Promise<{ projectId: string; sprintId: string }>
}) {
  const { projectId, sprintId } = await params
  const session = await auth()
  if (!session) redirect('/')

  const [sprint] = await db.select().from(sprints).where(eq(sprints.id, sprintId))
  if (!sprint) notFound()

  // Try to find the latest active PRD artifact
  const [prdArtifact] = await db
    .select()
    .from(artifacts)
    .where(and(eq(artifacts.type, 'prd'), eq(artifacts.status, 'current')))
    .orderBy(desc(artifacts.createdAt))
    .limit(1)

  // Fetch prior sprint's retro artifact and carry-forward stories
  let priorRetroContent: string | undefined
  let carryForwardStories: Array<{ title: string; description: string | null }> = []

  if (sprint.number > 1) {
    // Find the previous sprint
    const [prevSprint] = await db
      .select()
      .from(sprints)
      .where(
        and(
          eq(sprints.projectId, sprint.projectId),
          lt(sprints.number, sprint.number)
        )
      )
      .orderBy(desc(sprints.number))
      .limit(1)

    if (prevSprint) {
      // Get retro artifact from previous sprint
      const [retroArtifact] = await db
        .select()
        .from(artifacts)
        .where(
          and(
            eq(artifacts.sprintId, prevSprint.id),
            eq(artifacts.type, 'retro'),
            eq(artifacts.status, 'current')
          )
        )
        .orderBy(desc(artifacts.createdAt))
        .limit(1)

      if (retroArtifact) {
        priorRetroContent = retroArtifact.contentMd
      }

      // Get carry-forward stories (incomplete stories moved to this sprint)
      const carriedStories = await db
        .select({ title: stories.title, description: stories.description })
        .from(stories)
        .where(
          and(
            eq(stories.sprintId, sprintId),
            inArray(stories.status, ['todo'])
          )
        )

      if (carriedStories.length > 0) {
        carryForwardStories = carriedStories
      }
    }
  }

  return (
    <PlanningClient
      projectId={projectId}
      sprintId={sprintId}
      sprintNumber={sprint.number}
      prdContent={prdArtifact?.contentMd}
      priorRetro={priorRetroContent}
      carryForwardStories={carryForwardStories.length > 0 ? carryForwardStories : undefined}
    />
  )
}
