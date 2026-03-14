import { auth } from '@/auth'
import { db } from '@/lib/db'
import { projects, sprints } from '@scrumbs/db'
import { eq, and } from 'drizzle-orm'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProjectPage({
  params,
}: {
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

  const projectSprints = await db
    .select()
    .from(sprints)
    .where(eq(sprints.projectId, project.id))

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
      <p className="text-slate-400 mb-8">{project.githubOwner}/{project.githubRepo}</p>

      {projectSprints.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <p className="text-lg mb-4">No sprints yet</p>
          <p className="text-sm mb-6">Pablo will help you capture requirements and build a PRD before your first sprint.</p>
          <Link
            href={`/projects/${project.id}/requirements`}
            className="inline-block px-6 py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
          >
            Start with Pablo
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {projectSprints.map((sprint) => (
            <div
              key={sprint.id}
              className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-lg"
            >
              <span className="font-medium">Sprint {sprint.number}</span>
              <span className="text-sm text-slate-400 capitalize">{sprint.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
