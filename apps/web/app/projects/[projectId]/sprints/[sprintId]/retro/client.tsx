'use client'

import { StageWorkspace } from '@/components/stage-workspace'

interface RetroClientProps {
  projectId: string
  sprintId: string
  sprintNumber: number
  sprintStatus: string
  stories: Array<{ title: string; status: string }>
}

export function RetroClient({
  projectId,
  sprintId,
  sprintNumber,
  sprintStatus,
  stories,
}: RetroClientProps) {
  if (sprintStatus !== 'complete') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500 text-sm">
          Sprint retro will be available once the sprint is complete.
        </p>
      </div>
    )
  }

  return (
    <StageWorkspace
      projectId={projectId}
      sprintId={sprintId}
      personaName="stella"
      stage="retro"
      input={{
        persona: 'stella',
        stage: 'retro',
        sprintId,
        sprintNumber,
        completedStories: stories,
      }}
      artifactTitle="Retrospective"
    />
  )
}
