'use client'

import { StageWorkspace } from '@/components/stage-workspace'

interface ReviewClientProps {
  projectId: string
  sprintId: string
  sprintNumber: number
  featureBranch?: string
}

export function ReviewClient({ projectId, sprintId, sprintNumber, featureBranch }: ReviewClientProps) {
  return (
    <StageWorkspace
      projectId={projectId}
      sprintId={sprintId}
      personaName="rex"
      stage="review"
      input={{
        persona: 'rex',
        stage: 'review',
        sprintId,
        sprintNumber,
        featureBranch: featureBranch ?? `sprint-${sprintNumber}`,
      }}
      artifactTitle="Code Review"
    />
  )
}
