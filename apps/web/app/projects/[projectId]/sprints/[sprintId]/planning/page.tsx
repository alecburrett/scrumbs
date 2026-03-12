import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { sprints } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'

export default async function SprintPlanningPage({
  params,
}: {
  params: Promise<{ projectId: string; sprintId: string }>
}) {
  const { projectId, sprintId } = await params
  const session = await auth()
  if (!session) redirect('/')

  const [sprint] = await db.select().from(sprints).where(eq(sprints.id, sprintId))
  if (!sprint) notFound()

  return (
    <div className="flex h-full">
      <div className="flex-1 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#6B9E6B' }} />
          <span className="font-medium">Stella — Scrum Master</span>
          <span className="ml-auto text-xs text-slate-500">Sprint {sprint.number} Planning</span>
        </div>
        <div className="flex-1 p-4">
          <p className="text-slate-400 text-sm">
            Stella will run your sprint planning ceremony and create a sprint plan.
          </p>
        </div>
      </div>
      <div className="w-1/2 p-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-300">Sprint Plan</h2>
        <p className="text-slate-500 text-sm">Sprint plan will appear here.</p>
      </div>
    </div>
  )
}
