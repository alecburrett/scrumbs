import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { sprints } from '@scrumbs/db'
import { eq } from 'drizzle-orm'

export default async function DeployPage({
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
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#06B6D4' }} />
          <span className="font-medium">Dex — DevOps Engineer</span>
          <span className="ml-auto text-xs text-slate-500">Deployment</span>
        </div>
        <div className="flex-1 p-4">
          <p className="text-slate-400 text-sm">
            Dex will check CI/CD configuration, push the branch, and monitor the GitHub Actions pipeline.
          </p>
          <p className="text-slate-500 text-xs mt-2">
            Branch: {sprint.featureBranch ?? 'not set'}
          </p>
        </div>
      </div>
      <div className="w-1/2 p-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-300">Deploy Log</h2>
        <p className="text-slate-500 text-sm">
          GitHub Actions pipeline status will stream here. &quot;We&apos;re green.&quot;
        </p>
        <div className="mt-6 bg-slate-950 rounded-lg border border-slate-800 p-4 font-mono text-sm text-slate-500">
          Awaiting Dex…
        </div>
      </div>
    </div>
  )
}
