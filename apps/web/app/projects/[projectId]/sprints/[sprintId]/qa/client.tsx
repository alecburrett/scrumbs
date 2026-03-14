'use client'

import type { StoryStatus } from '@scrumbs/types'
import { KanbanStrip } from '@/components/kanban-strip'
import { StageWorkspace } from '@/components/stage-workspace'

interface QaClientProps {
  projectId: string
  sprintId: string
  sprintNumber: number
  featureBranch?: string
  stories: Array<{
    id: string
    title: string
    status: StoryStatus
  }>
}

export function QaClient({ projectId, sprintId, sprintNumber, featureBranch, stories }: QaClientProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Kanban strip */}
      <div className="h-48 border-b border-slate-800 p-4 pb-0">
        <h2 className="text-sm font-semibold text-slate-400 mb-3">
          Sprint {sprintNumber} Stories
        </h2>
        <KanbanStrip initialStories={stories} />
      </div>

      {/* Stage workspace */}
      <div className="flex-1 min-h-0">
        <StageWorkspace
          projectId={projectId}
          sprintId={sprintId}
          personaName="quinn"
          stage="qa"
          input={{
            persona: 'quinn',
            stage: 'qa',
            sprintId,
            sprintNumber,
            featureBranch: featureBranch ?? `sprint-${sprintNumber}`,
          }}
          artifactTitle="QA Report"
          previousPersona="rex"
        />
      </div>
    </div>
  )
}
