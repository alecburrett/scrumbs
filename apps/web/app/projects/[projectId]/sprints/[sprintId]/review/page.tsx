import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sprints } from '@scrumbs/db'
import { eq } from 'drizzle-orm'

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ projectId: string; sprintId: string }>
}) {
  const { sprintId } = await params
  const session = await auth()
  if (!session) redirect('/')

  const [sprint] = await db.select().from(sprints).where(eq(sprints.id, sprintId))
  if (!sprint) notFound()

  return (
    <div className="flex h-full">
      <div className="flex-1 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#7C3AED' }} />
          <span className="font-medium">Rex — Tech Lead</span>
          <span className="ml-auto text-xs text-slate-500">Code Review</span>
        </div>
        <div className="flex-1 p-4">
          <p className="text-slate-400 text-sm">
            Rex will review the pull request for this sprint and provide feedback.
          </p>
          <p className="text-slate-500 text-xs mt-2">
            Sprint {sprint.number} · Branch: {sprint.featureBranch ?? 'not set'}
          </p>
        </div>
      </div>
      <div className="w-1/2 p-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-300">Code Review</h2>
        <p className="text-slate-500 text-sm">
          Rex&apos;s review will appear here. Findings are classified as:
          🔴 Critical · 🟡 Important · 🟢 Suggestion
        </p>
        <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-800 text-sm text-slate-500">
          Awaiting Rex…
        </div>
      </div>
    </div>
  )
}
