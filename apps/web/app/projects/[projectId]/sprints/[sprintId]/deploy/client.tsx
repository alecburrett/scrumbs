'use client'

import { StageWorkspace } from '@/components/stage-workspace'

interface DeployClientProps {
  projectId: string
  sprintId: string
  sprintNumber: number
  featureBranch?: string
}

export function DeployClient({ projectId, sprintId, sprintNumber, featureBranch }: DeployClientProps) {
  return (
    <StageWorkspace
      projectId={projectId}
      sprintId={sprintId}
      personaName="dex"
      stage="deploy"
      input={{
        stage: 'deploy',
        sprintNumber,
        featureBranch: featureBranch ?? `sprint-${sprintNumber}`,
      }}
      artifactTitle="Deploy Log"
    />
  )
}
