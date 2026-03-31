import { auth } from '@/auth'
import { db } from '@/lib/db'
import { projects } from '@scrumbs/db'
import { eq, and } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'
import { RequirementsClient } from './client'

export default async function RequirementsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const [project] = await db
    .select({ name: projects.name })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))
    .limit(1)

  if (!project) notFound()

  return <RequirementsClient projectId={projectId} projectName={project.name} />
}
