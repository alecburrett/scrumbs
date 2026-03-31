'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { StageWorkspace } from '@/components/stage-workspace'

export function RequirementsClient({ projectId }: { projectId: string }) {
  const router = useRouter()

  const handleApprove = useCallback(async (artifact: string | null, taskId: string | null) => {
    if (artifact) {
      await fetch(`/api/projects/${projectId}/artifacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'requirements',
          contentMd: artifact,
          agentTaskId: taskId,
        }),
      })
    }
    router.push(`/projects/${projectId}/prd`)
  }, [projectId, router])

  return (
    <StageWorkspace
      projectId={projectId}
      personaName="pablo"
      stage="requirements"
      input={{ persona: 'pablo', stage: 'requirements' }}
      artifactTitle="Requirements"
      inputPlaceholder="Describe your project to Pablo..."
      onApprove={handleApprove}
    />
  )
}
