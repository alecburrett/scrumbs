export type ProjectStatus = 'active' | 'archived'

export type SprintStatus =
  | 'planning' | 'setup' | 'development'
  | 'review' | 'qa' | 'deploying' | 'complete'

export type StoryStatus = 'todo' | 'in_progress' | 'done'

export type ArtifactType =
  | 'requirements' | 'prd' | 'sprint-plan'
  | 'test-report' | 'review' | 'retro' | 'deploy-url'

export type PersonaName = 'pablo' | 'stella' | 'viktor' | 'rex' | 'quinn' | 'dex' | 'max'

export type Stage =
  | 'requirements' | 'prd' | 'planning' | 'setup'
  | 'development' | 'review' | 'qa' | 'deploy' | 'retro'

export type AgentTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  toolCalls?: unknown[]
}
