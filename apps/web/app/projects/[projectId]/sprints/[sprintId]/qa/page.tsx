import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sprints, stories } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import { QaClient } from './client'

export default async function QaPage({
  params,
}: {
  params: Promise<{ projectId: string; sprintId: string }>
}) {
  const { projectId, sprintId } = await params
  const session = await auth()
  if (!session) redirect('/')

  const [sprint] = await db.select().from(sprints).where(eq(sprints.id, sprintId))
  if (!sprint) notFound()

  const sprintStories = await db.select().from(stories).where(eq(stories.sprintId, sprintId))

  return (
    <QaClient
      projectId={projectId}
      sprintId={sprintId}
      sprintNumber={sprint.number}
      featureBranch={sprint.featureBranch ?? undefined}
      stories={sprintStories.map((s) => ({
        id: s.id,
        title: s.title,
        status: s.status,
      }))}
    />
  )
}
