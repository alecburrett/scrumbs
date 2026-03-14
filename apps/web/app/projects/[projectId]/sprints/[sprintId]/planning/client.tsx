'use client'

import { StageWorkspace } from '@/components/stage-workspace'

interface PlanningClientProps {
  projectId: string
  sprintId: string
  sprintNumber: number
  prdContent?: string
  priorRetro?: string
  carryForwardStories?: Array<{ title: string; description: string | null }>
}

export function PlanningClient({ projectId, sprintId, sprintNumber, prdContent, priorRetro, carryForwardStories }: PlanningClientProps) {
  return (
    <StageWorkspace
      projectId={projectId}
      sprintId={sprintId}
      personaName="stella"
      stage="planning"
      input={{
        persona: 'stella',
        stage: 'planning',
        sprintId,
        sprintNumber,
        ...(prdContent ? { prdContent } : {}),
        ...(priorRetro ? { priorRetro } : {}),
        ...(carryForwardStories ? { carryForwardStories } : {}),
      }}
      artifactTitle={`Sprint ${sprintNumber} Plan`}
    />
  )
}
