import { auth } from '@/auth'
import { db } from '@/lib/db'
import { projects } from '@scrumbs/db'
import { eq, and } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import { StageProgressBar } from '@/components/stage-progress-bar'
import { FilesPanel } from '@/components/files-panel'

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
      {/* Top bar */}
      <header className="border-b border-terminal-border px-4 py-2 flex items-center gap-4 bg-terminal-bg shrink-0">
        <span className="text-xs font-mono text-terminal-accent shrink-0">
          {project.name.toLowerCase()}
        </span>
        <span className="text-terminal-dim text-xs">·</span>
        <StageProgressBar currentStage={undefined} projectId={projectId} />
      </header>

      {/* Content + Files */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">{children}</div>
        <FilesPanel projectId={projectId} />
      </div>
    </div>
  )
}
