import { auth } from '@/auth'
import { db } from '@/lib/db'
import { projects, sprints } from '@scrumbs/db'
import { eq, desc } from 'drizzle-orm'
import Link from 'next/link'
import type { SprintStatus } from '@scrumbs/types'

// Maps sprint status to the correct page path
function sprintStagePath(projectId: string, sprintId: string, status: SprintStatus): string {
  const base = `/projects/${projectId}/sprints/${sprintId}`
  switch (status) {
    case 'planning':    return `${base}/planning`
    case 'development': return `${base}/development`
    case 'review':      return `${base}/review`
    case 'qa':          return `${base}/qa`
    case 'deploying':   return `${base}/deploy`
    case 'complete':    return `${base}/retro`
    default:            return base
  }
}

interface ProjectWithSprint {
  id: string
  name: string
  githubOwner: string
  githubRepo: string
  latestSprint: {
    id: string
    number: number
    status: SprintStatus
  } | null
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id))

  // For each project, get latest sprint
  const projectsWithSprints: ProjectWithSprint[] = await Promise.all(
    userProjects.map(async (project) => {
      const [latestSprint] = await db
        .select({ id: sprints.id, number: sprints.number, status: sprints.status })
        .from(sprints)
        .where(eq(sprints.projectId, project.id))
        .orderBy(desc(sprints.number))
        .limit(1)

      return {
        ...project,
        latestSprint: latestSprint
          ? { ...latestSprint, status: latestSprint.status as SprintStatus }
          : null,
      }
    })
  )

  if (projectsWithSprints.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-96 text-slate-400">
        <p className="text-xl mb-4">No projects yet</p>
        <Link
          href="/projects/new"
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create your first project
        </Link>
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Projects</h1>
        <Link
          href="/projects/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Project
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projectsWithSprints.map((project) => {
          const sprint = project.latestSprint
          const isActive = sprint && sprint.status !== 'complete'
          const href = sprint
            ? sprintStagePath(project.id, sprint.id, sprint.status)
            : `/projects/${project.id}`

          return (
            <Link
              key={project.id}
              href={href}
              className="block p-6 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-600 transition-colors"
            >
              <h2 className="text-lg font-semibold mb-1">{project.name}</h2>
              <p className="text-slate-400 text-sm mb-3">
                {project.githubOwner}/{project.githubRepo}
              </p>
              {sprint ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">Sprint {sprint.number}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-blue-900/50 text-blue-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {sprint.status}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-slate-600">No sprints yet</span>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
