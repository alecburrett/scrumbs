'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { StageWorkspace } from '@/components/stage-workspace'
import { IntakeForm, PRD_INTAKE_FIELDS } from '@/components/intake-form'

interface PrdClientProps {
  projectId: string
  projectName: string
  existingRequirements?: string
}

export function PrdClient({ projectId, projectName, existingRequirements }: PrdClientProps) {
  const router = useRouter()
  const [intakeValues, setIntakeValues] = useState<Record<string, string> | null>(null)

  const handleApprove = useCallback(async (artifact: string | null, taskId: string | null) => {
    if (!artifact || !taskId) {
      throw new Error('A PRD must be generated before approving.')
    }
    const artifactRes = await fetch(`/api/projects/${projectId}/artifacts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'prd', contentMd: artifact, agentTaskId: taskId }),
    })
    if (!artifactRes.ok) {
      const data = await artifactRes.json().catch(() => ({}))
      throw new Error(data.error ?? 'Failed to save PRD')
    }

    const sprintRes = await fetch(`/api/projects/${projectId}/sprints`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!sprintRes.ok) {
      const data = await sprintRes.json().catch(() => ({}))
      if (data.sprintId) {
        router.push(`/projects/${projectId}/sprints/${data.sprintId}/planning`)
        return
      }
      throw new Error(data.error ?? 'Failed to create sprint')
    }
    const sprint = await sprintRes.json()
    router.push(`/projects/${projectId}/sprints/${sprint.id}/planning`)
  }, [projectId, router])

  if (!intakeValues) {
    return (
      <IntakeForm
        personaName="pablo"
        stage="prd"
        fields={PRD_INTAKE_FIELDS}
        onSubmit={setIntakeValues}
      />
    )
  }

  return (
    <StageWorkspace
      projectId={projectId}
      personaName="pablo"
      stage="prd"
      input={{
        persona: 'pablo',
        stage: 'prd',
        projectName,
        ...(existingRequirements ? { existingRequirements } : {}),
        ...intakeValues,
      }}
      artifactTitle="PRD"
      onApprove={handleApprove}
      previousPersona="pablo"
    />
  )
}
