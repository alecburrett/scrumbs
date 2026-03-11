export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getProjectsByUser } from '@/lib/services/projects'
import { Sidebar } from '@/components/dashboard/Sidebar'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId?: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const projects = await getProjectsByUser(session.user.id)
  const { projectId } = await params

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar projects={projects} currentProjectId={projectId ?? null} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
