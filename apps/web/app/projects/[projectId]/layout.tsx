import { auth } from '@/auth'
import { db } from '@/lib/db'
import { projects } from '@scrumbs/db'
import { eq, and } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import { StageProgressBar } from '@/components/stage-progress-bar'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id)))

  if (!project) notFound()

  return (
    <div className="flex flex-col h-full">
      <header className="border-b border-slate-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">{project.name}</span>
          <StageProgressBar currentStage={undefined} />
        </div>
      </header>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
