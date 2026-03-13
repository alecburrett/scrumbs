import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sprints, stories } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import { RetroClient } from './client'

export default async function RetroPage({
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
    <RetroClient
      projectId={projectId}
      sprintId={sprintId}
      sprintNumber={sprint.number}
      sprintStatus={sprint.status}
      stories={sprintStories.map((s) => ({
        title: s.title,
        status: s.status,
      }))}
    />
  )
}
