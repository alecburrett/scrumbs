export type ArtifactType =
  | 'requirements'
  | 'prd'
  | 'sprint-plan'
  | 'code-review'
  | 'qa-report'
  | 'deploy-log'
  | 'retro'

export interface Artifact {
  id: string
  agentTaskId: string
  sprintId: string
  type: ArtifactType
  contentMd: string
  status: 'active' | 'superseded'
  createdAt: Date
}
