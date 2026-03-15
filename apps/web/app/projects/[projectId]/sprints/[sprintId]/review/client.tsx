'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { StageWorkspace } from '@/components/stage-workspace'

interface ReviewClientProps {
  projectId: string
  sprintId: string
  sprintNumber: number
  featureBranch?: string
}

export function ReviewClient({ projectId, sprintId, sprintNumber, featureBranch }: ReviewClientProps) {
  const router = useRouter()

  const handleApprove = useCallback(async (artifact: string | null, taskId: string | null) => {
    const res = await fetch(`/api/sprints/${sprintId}/approve-stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artifactContent: artifact,
        artifactType: 'review',
        agentTaskId: taskId,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Failed to approve review')
    }
    router.push(`/projects/${projectId}/sprints/${sprintId}/qa`)
  }, [sprintId, projectId, router])

  return (
    <StageWorkspace
      projectId={projectId}
      sprintId={sprintId}
      personaName="rex"
      stage="review"
      input={{
        persona: 'rex',
        stage: 'review',
        sprintId,
        sprintNumber,
        featureBranch: featureBranch ?? `sprint-${sprintNumber}`,
      }}
      artifactTitle="Code Review"
      onApprove={handleApprove}
      previousPersona="viktor"
    />
  )
}
