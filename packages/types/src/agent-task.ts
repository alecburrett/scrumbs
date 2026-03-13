import type { PersonaName } from './persona.js'

export type AgentTaskStatus =
  | 'pending'
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type SSEEventType =
  | 'tool_call'
  | 'tool_output'
  | 'file_write'
  | 'test_pass'
  | 'test_fail'
  | 'git_op'
  | 'error'
  | 'approval_required'
  | 'context_summary'
  | 'retry'
  | 'story_status'
  | 'handoff'
  | 'done'
  | 'message'

export interface SSEEvent {
  type: SSEEventType
  taskId: string
  sessionId: string
  payload: unknown
  timestamp: string
}

// Persona input types
export interface PabloInput {
  projectName: string
  githubRepo: string
  rawRequirements?: string
  existingRequirements?: string
}

export interface StellaSprintInput {
  projectName: string
  prdContent: string
  previousSprintSummary?: string
  githubRepo: string
}

export interface StellaRetroInput {
  projectName: string
  sprintNumber: number
  completedStories: Array<{ title: string; status: string }>
  githubRepo: string
}

export interface ViktorInput {
  sprintPlan: string
  featureBranch: string
  workspaceDir: string
  githubRepo: string
  stories: Array<{ id: string; title: string; description: string }>
}

export interface RexInput {
  prDiff: string
  prNumber: number
  githubRepo: string
  sprintPlan: string
}

export interface QuinnInput {
  featureBranch: string
  workspaceDir: string
  testRunner: string
  githubRepo: string
}

export interface DexInput {
  featureBranch: string
  githubRepo: string
  workspaceDir: string
}

export interface AgentTaskInput {
  pablo: PabloInput
  stella_sprint: StellaSprintInput
  stella_retro: StellaRetroInput
  viktor: ViktorInput
  rex: RexInput
  quinn: QuinnInput
  dex: DexInput
  max: Record<string, never>
}
