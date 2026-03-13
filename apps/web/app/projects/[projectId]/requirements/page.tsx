import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { RequirementsClient } from './client'

export default async function RequirementsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const session = await auth()
  if (!session) redirect('/')

  return <RequirementsClient projectId={projectId} />
}
