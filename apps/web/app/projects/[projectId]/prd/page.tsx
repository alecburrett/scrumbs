import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { artifacts, projects } from '@scrumbs/db'
import { eq, and, desc } from 'drizzle-orm'
import { PrdClient } from './client'

export default async function PrdPage({
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

  const [reqArtifact] = await db
    .select({ contentMd: artifacts.contentMd })
    .from(artifacts)
    .where(and(
      eq(artifacts.projectId, projectId),
      eq(artifacts.type, 'requirements'),
      eq(artifacts.status, 'current'),
    ))
    .orderBy(desc(artifacts.createdAt))
    .limit(1)

  return (
    <PrdClient
      projectId={projectId}
      projectName={project.name}
      existingRequirements={reqArtifact?.contentMd}
    />
  )
}
