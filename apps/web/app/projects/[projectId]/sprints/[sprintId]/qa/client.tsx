'use client'

import { StageWorkspace } from '@/components/stage-workspace'

interface QaClientProps {
  projectId: string
  sprintId: string
  sprintNumber: number
  featureBranch?: string
}

export function QaClient({ projectId, sprintId, sprintNumber, featureBranch }: QaClientProps) {
  return (
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
    />
  )
}
