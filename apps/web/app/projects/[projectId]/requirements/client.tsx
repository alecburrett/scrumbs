'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { StageWorkspace } from '@/components/stage-workspace'
import { IntakeForm, REQUIREMENTS_INTAKE_FIELDS } from '@/components/intake-form'

interface RequirementsClientProps {
  projectId: string
  projectName: string
}

export function RequirementsClient({ projectId, projectName }: RequirementsClientProps) {
  const router = useRouter()
  const [intakeValues, setIntakeValues] = useState<Record<string, string> | null>(null)

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

  // Step 1 — show intake form until submitted
  if (!intakeValues) {
    return (
      <IntakeForm
        personaName="pablo"
        stage="requirements"
        fields={REQUIREMENTS_INTAKE_FIELDS}
        prefilled={{ projectName }}
        onSubmit={setIntakeValues}
      />
    )
  }

  // Step 2 — intake done, Pablo continues the conversation
  const workspaceInput = {
    persona: 'pablo',
    stage: 'requirements',
    projectName,
    ...intakeValues,
    // Format intake as the initial user message Pablo receives
    rawRequirements: formatIntakeAsMessage(projectName, intakeValues),
  }

  return (
    <StageWorkspace
      projectId={projectId}
      personaName="pablo"
      stage="requirements"
      input={workspaceInput}
      artifactTitle="Requirements"
      onApprove={handleApprove}
    />
  )
}

function formatIntakeAsMessage(projectName: string, values: Record<string, string>): string {
  const lines = [`Project: ${projectName}`]
  if (values.projectDescription) lines.push(`Problem: ${values.projectDescription}`)
  if (values.targetUsers)        lines.push(`Target users: ${values.targetUsers}`)
  if (values.domain)             lines.push(`Domain: ${values.domain}`)
  if (values.techStack)          lines.push(`Tech stack: ${values.techStack}`)
  if (values.constraints)        lines.push(`Constraints: ${values.constraints}`)
  return lines.join('\n')
}
