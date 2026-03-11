export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { StageProgress } from '@/components/dashboard/StageProgress'

export default async function SprintPage({
  params,
}: {
  params: Promise<{ projectId: string; sprintId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { projectId, sprintId } = await params

  return (
    <div className="flex flex-col h-full">
      <StageProgress currentStage="planning" completedStages={[]} />
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">Sprint workspace</p>
          <p className="text-sm">Persona Engine coming in Plan 2</p>
          <p className="text-xs mt-2 opacity-50">Sprint: {sprintId} · Project: {projectId}</p>
        </div>
      </div>
    </div>
  )
}
