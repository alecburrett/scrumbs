'use client'

import { StageWorkspace } from '@/components/stage-workspace'

interface PrdClientProps {
  projectId: string
  existingRequirements?: string
}

export function PrdClient({ projectId, existingRequirements }: PrdClientProps) {
  return (
    <StageWorkspace
      projectId={projectId}
      personaName="pablo"
      stage="prd"
      input={{
        stage: 'prd',
        ...(existingRequirements ? { existingRequirements } : {}),
      }}
      artifactTitle="PRD"
    />
  )
}
