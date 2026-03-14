'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { StageWorkspace } from '@/components/stage-workspace'

interface DeployClientProps {
  projectId: string
  sprintId: string
  sprintNumber: number
  featureBranch?: string
}

export function DeployClient({ projectId, sprintId, sprintNumber, featureBranch }: DeployClientProps) {
  const router = useRouter()

  const handleApprove = useCallback(async (artifact: string | null, taskId: string | null) => {
    const res = await fetch(`/api/sprints/${sprintId}/approve-stage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artifactContent: artifact,
        artifactType: 'deploy-record',
        agentTaskId: taskId,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Failed to complete deploy')
    }
    router.push(`/projects/${projectId}/sprints/${sprintId}/retro`)
  }, [sprintId, projectId, router])

  return (
    <StageWorkspace
      projectId={projectId}
      sprintId={sprintId}
      personaName="dex"
      stage="deploy"
      input={{
        persona: 'dex',
        stage: 'deploy',
        sprintId,
        sprintNumber,
        featureBranch: featureBranch ?? `sprint-${sprintNumber}`,
      }}
      artifactTitle="Deploy Log"
      onApprove={handleApprove}
      previousPersona="quinn"
    />
  )
}
