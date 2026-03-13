import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sprints } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import { DeployClient } from './client'

export default async function DeployPage({
  params,
}: {
  params: Promise<{ projectId: string; sprintId: string }>
}) {
  const { projectId, sprintId } = await params
  const session = await auth()
  if (!session) redirect('/')

  const [sprint] = await db.select().from(sprints).where(eq(sprints.id, sprintId))
  if (!sprint) notFound()

  return (
    <DeployClient
      projectId={projectId}
      sprintId={sprintId}
      sprintNumber={sprint.number}
      featureBranch={sprint.featureBranch ?? undefined}
    />
  )
}
