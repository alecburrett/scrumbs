'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import { StageWorkspace } from '@/components/stage-workspace'

interface PrdClientProps {
  projectId: string
  existingRequirements?: string
}

export function PrdClient({ projectId, existingRequirements }: PrdClientProps) {
  const router = useRouter()

  const handleApprove = useCallback(async (artifact: string | null, taskId: string | null) => {
    // 1. Store PRD artifact
    if (!artifact || !taskId) {
      throw new Error('A PRD must be generated before approving.')
    }
    const artifactRes = await fetch(`/api/projects/${projectId}/artifacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'prd',
        contentMd: artifact,
        agentTaskId: taskId,
      }),
    })
    if (!artifactRes.ok) {
      const data = await artifactRes.json().catch(() => ({}))
      throw new Error(data.error ?? 'Failed to save PRD')
    }

    // 2. Create Sprint 1
    const sprintRes = await fetch(`/api/projects/${projectId}/sprints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })

    if (!sprintRes.ok) {
      const data = await sprintRes.json().catch(() => ({}))
      // If a sprint already exists, use it
      if (data.sprintId) {
        router.push(`/projects/${projectId}/sprints/${data.sprintId}/planning`)
        return
      }
      throw new Error(data.error ?? 'Failed to create sprint')
    }

    const sprint = await sprintRes.json()
    router.push(`/projects/${projectId}/sprints/${sprint.id}/planning`)
  }, [projectId, router])

  return (
    <StageWorkspace
      projectId={projectId}
      personaName="pablo"
      stage="prd"
      input={{
        persona: 'pablo',
        stage: 'prd',
        ...(existingRequirements ? { existingRequirements } : {}),
      }}
      artifactTitle="PRD"
      inputPlaceholder="Tell Pablo what you'd like in the PRD..."
      onApprove={handleApprove}
      previousPersona="pablo"
    />
  )
}
