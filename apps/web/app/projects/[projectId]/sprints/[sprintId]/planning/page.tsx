import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sprints, artifacts } from '@scrumbs/db'
import { eq, and, desc } from 'drizzle-orm'
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

  return (
    <PlanningClient
      projectId={projectId}
      sprintId={sprintId}
      sprintNumber={sprint.number}
      prdContent={prdArtifact?.contentMd}
    />
  )
}
