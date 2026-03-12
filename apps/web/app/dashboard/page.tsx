import { auth } from '@/auth'
import { db } from '@/lib/db'
import { projects } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id))

  if (userProjects.length === 0) {
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
      <h1 className="text-2xl font-bold mb-6">Your Projects</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {userProjects.map((project) => (
          <Link
            key={project.id}
            href={`/projects/${project.id}`}
            className="block p-6 bg-slate-900 border border-slate-800 rounded-lg hover:border-slate-600 transition-colors"
          >
            <h2 className="text-lg font-semibold mb-1">{project.name}</h2>
            <p className="text-slate-400 text-sm">{project.githubOwner}/{project.githubRepo}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
