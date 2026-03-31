'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { StageWorkspace } from '@/components/stage-workspace'

interface PlanningClientProps {
  projectId: string
  sprintId: string
  sprintNumber: number
  prdContent?: string
  priorRetro?: string
  carryForwardStories?: Array<{ title: string; description: string | null; status: string }>
}

export function PlanningClient({ projectId, sprintId, sprintNumber, prdContent, priorRetro, carryForwardStories }: PlanningClientProps) {
  const router = useRouter()

  const handleApprove = useCallback(async (artifact: string | null, taskId: string | null) => {
    const res = await fetch(`/api/sprints/${sprintId}/approve-stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artifactContent: artifact,
        artifactType: 'sprint-plan',
        agentTaskId: taskId,
        // TODO: parse stories from artifact for structured story creation
        stories: [],
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Failed to approve sprint plan')
    }

    router.push(`/projects/${projectId}/sprints/${sprintId}/development`)
  }, [sprintId, projectId, router])

  return (
    <StageWorkspace
      projectId={projectId}
      sprintId={sprintId}
      personaName="stella"
      stage="planning"
      input={{
        persona: 'stella',
        stage: 'planning',
        sprintId,
        sprintNumber,
        ...(prdContent ? { prdContent } : {}),
        ...(priorRetro ? { priorRetro } : {}),
        ...(carryForwardStories ? { carryForwardStories } : {}),
      }}
      artifactTitle={`Sprint ${sprintNumber} Plan`}
      inputPlaceholder="Tell Stella what you'd like to focus on..."
      onApprove={handleApprove}
    />
  )
}
