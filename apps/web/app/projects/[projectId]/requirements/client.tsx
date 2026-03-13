'use client'

import { StageWorkspace } from '@/components/stage-workspace'

export function RequirementsClient({ projectId }: { projectId: string }) {
  return (
    <StageWorkspace
      projectId={projectId}
      personaName="pablo"
      stage="requirements"
      input={{ stage: 'requirements' }}
      artifactTitle="Requirements"
    />
  )
}
