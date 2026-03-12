import { auth } from '@/auth'
import { db } from '@/lib/db'
import { projects } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

export async function ProjectList() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.userId, session.user.id))

  if (userProjects.length === 0) {
    return (
      <p className="text-slate-500 text-sm px-2">No projects yet</p>
    )
  }

  return (
    <ul className="space-y-1">
      {userProjects.map((project) => (
        <li key={project.id}>
          <Link
            href={`/projects/${project.id}`}
            className="flex items-center px-2 py-2 rounded-md text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm"
          >
            {project.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}
