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
      <p className="terminal-label px-4 py-2">no projects</p>
    )
  }

  return (
    <ul>
      {userProjects.map((project) => (
        <li key={project.id}>
          <Link
            href={`/projects/${project.id}`}
            className="flex items-center px-4 py-1.5 text-xs font-mono text-terminal-muted hover:text-terminal-accent hover:bg-terminal-surface transition-colors"
          >
            <span className="text-terminal-dim mr-2">/</span>
            {project.name.toLowerCase()}
          </Link>
        </li>
      ))}
    </ul>
  )
}
