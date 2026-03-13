import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { sprints, stories } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

export default async function SprintDevelopmentPage({
  params,
}: {
  params: Promise<{ projectId: string; sprintId: string }>
}) {
  const { projectId, sprintId } = await params
  const session = await auth()
  if (!session) redirect('/')

  const [sprint] = await db.select().from(sprints).where(eq(sprints.id, sprintId))
  if (!sprint) notFound()

  const sprintStories = await db.select().from(stories).where(eq(stories.sprintId, sprintId))

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Kanban strip */}
      <div className="h-48 border-b border-slate-800 pb-4">
        <h2 className="text-sm font-semibold text-slate-400 mb-3">Stories</h2>
        <div className="flex gap-4 h-32">
          {(['todo', 'in-progress', 'done'] as const).map((status) => (
            <div key={status} className="flex-1">
              <div className="text-xs text-slate-500 uppercase mb-2">{status}</div>
              {sprintStories
                .filter((s) => s.status === status)
                .map((story) => (
                  <div key={story.id} className="p-2 bg-slate-800 rounded text-xs text-slate-300 mb-1">
                    {story.title}
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
      {/* Terminal panel placeholder */}
      <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-4">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-xs text-slate-400 font-mono">Viktor — terminal</span>
        </div>
        <p className="text-slate-600 font-mono text-sm">Waiting for Viktor to start…</p>
      </div>
    </div>
  )
}
