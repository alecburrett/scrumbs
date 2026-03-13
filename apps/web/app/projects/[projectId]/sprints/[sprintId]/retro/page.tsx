import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sprints } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import Link from 'next/link'

export default async function RetroPage({
  params,
}: {
  params: Promise<{ projectId: string; sprintId: string }>
}) {
  const { projectId, sprintId } = await params
  const session = await auth()
  if (!session) redirect('/')

  const [sprint] = await db.select().from(sprints).where(eq(sprints.id, sprintId))
  if (!sprint) notFound()

  const isComplete = sprint.status === 'complete'

  return (
    <div className="flex h-full">
      <div className="flex-1 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6B9E6B' }} />
          <span className="font-medium">Stella — Scrum Master</span>
          <span className="ml-auto text-xs text-slate-500">Sprint {sprint.number} Retrospective</span>
        </div>
        <div className="flex-1 p-4">
          <p className="text-slate-400 text-sm">
            Stella will facilitate the retrospective ceremony. What went well, what to improve, and what to carry forward.
          </p>
        </div>
        {isComplete && (
          <div className="p-4 border-t border-slate-800">
            <form action={`/api/sprints/${sprintId}/retro`} method="POST">
              <button
                type="submit"
                className="w-full py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                Start Sprint {sprint.number + 1} →
              </button>
            </form>
          </div>
        )}
      </div>
      <div className="w-1/2 p-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-300">Retrospective</h2>
        {isComplete ? (
          <div className="space-y-3">
            <div className="p-4 bg-green-900/20 border border-green-800/50 rounded-lg">
              <p className="text-green-400 font-semibold text-sm">Sprint {sprint.number} Complete ✓</p>
            </div>
            <p className="text-slate-400 text-sm">
              Retro notes will appear here as Stella facilitates the ceremony.
            </p>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">
            Sprint retro will be available once the sprint is complete.
          </p>
        )}
      </div>
    </div>
  )
}
