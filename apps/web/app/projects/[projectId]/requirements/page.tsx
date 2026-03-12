import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function RequirementsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const session = await auth()
  if (!session) redirect('/')

  return (
    <div className="flex h-full">
      {/* Conversation Panel */}
      <div className="flex-1 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
          <span className="font-medium">Pablo — Product Owner</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-slate-400 text-sm">
            Pablo will help you define your requirements. Click &quot;Start with Pablo&quot; to begin.
          </p>
        </div>
        <div className="p-4 border-t border-slate-800">
          <button
            className="w-full py-2 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 transition-colors"
            onClick={() => {}}
          >
            Start with Pablo
          </button>
        </div>
      </div>
      {/* Artifact Panel */}
      <div className="w-1/2 p-6">
        <h2 className="text-lg font-semibold mb-4 text-slate-300">Requirements</h2>
        <p className="text-slate-500 text-sm">Requirements will appear here as Pablo works.</p>
      </div>
    </div>
  )
}
