'use client'

import { StageWorkspace } from '@/components/stage-workspace'

interface PlanningClientProps {
  projectId: string
  sprintId: string
  sprintNumber: number
  prdContent?: string
}

export function PlanningClient({ projectId, sprintId, sprintNumber, prdContent }: PlanningClientProps) {
  return (
    <StageWorkspace
      projectId={projectId}
      sprintId={sprintId}
      personaName="stella"
      stage="planning"
      input={{
        stage: 'planning',
        sprintNumber,
        ...(prdContent ? { prdContent } : {}),
      }}
      artifactTitle={`Sprint ${sprintNumber} Plan`}
    />
  )
}
