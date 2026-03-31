'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { StageWorkspace } from '@/components/stage-workspace'

export function RequirementsClient({ projectId }: { projectId: string }) {
  const router = useRouter()

  const handleApprove = useCallback(async (artifact: string | null, taskId: string | null) => {
    if (!artifact || !taskId) {
      throw new Error('A requirements document must be generated before approving.')
    }
    const res = await fetch(`/api/projects/${projectId}/artifacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'requirements',
        contentMd: artifact,
        agentTaskId: taskId,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error ?? 'Failed to save requirements')
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
