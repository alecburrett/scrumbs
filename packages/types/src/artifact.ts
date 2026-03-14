export type ArtifactType =
  | 'requirements'
  | 'prd'
  | 'sprint-plan'
  | 'test-report'
  | 'review'
  | 'deploy-record'
  | 'retro'

export type ArtifactStatus = 'current' | 'superseded'

export interface Artifact {
  id: string
  projectId: string
  agentTaskId: string
  sprintId: string | null
  type: ArtifactType
  contentMd: string
  commitSha: string | null
  status: ArtifactStatus
  createdAt: Date
  updatedAt: Date
}
