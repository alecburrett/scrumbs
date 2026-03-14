'use client'

import { StageWorkspace } from '@/components/stage-workspace'

export function RequirementsClient({ projectId }: { projectId: string }) {
  return (
    <StageWorkspace
      projectId={projectId}
      personaName="pablo"
      stage="requirements"
      input={{ persona: 'pablo', stage: 'requirements' }}
      artifactTitle="Requirements"
    />
  )
}
