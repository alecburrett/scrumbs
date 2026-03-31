'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
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
  const router = useRouter()

  const handleApprove = useCallback(async (artifact: string | null, taskId: string | null) => {
    const res = await fetch(`/api/sprints/${sprintId}/approve-stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artifactContent: artifact,
        artifactType: 'test-report',
        agentTaskId: taskId,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Failed to approve QA')
    }
    router.push(`/projects/${projectId}/sprints/${sprintId}/deploy`)
  }, [sprintId, projectId, router])

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
          onApprove={handleApprove}
          previousPersona="rex"
        />
      </div>
    </div>
  )
}
