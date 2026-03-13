import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { artifacts } from '@scrumbs/db'
import { eq, and, desc } from 'drizzle-orm'
import { PrdClient } from './client'

export default async function PrdPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const session = await auth()
  if (!session) redirect('/')

  // Try to find existing requirements artifact for this project
  // Requirements artifacts are linked via agent tasks -> sprints -> projects,
  // but for pre-sprint stages we look for any active requirements artifact
  const [reqArtifact] = await db
    .select()
    .from(artifacts)
    .where(and(eq(artifacts.type, 'requirements'), eq(artifacts.status, 'active')))
    .orderBy(desc(artifacts.createdAt))
    .limit(1)

  return (
    <PrdClient
      projectId={projectId}
      existingRequirements={reqArtifact?.contentMd}
    />
  )
}
