import type { PersonaName } from './persona.js'

export type AgentTaskStatus =
  | 'pending'
  | 'running'
  | 'waiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type Stage =
  | 'requirements'
  | 'prd'
  | 'planning'
  | 'development'
  | 'review'
  | 'qa'
  | 'deploy'
  | 'retro'

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

// --- Input shapes (sent to agent service) ---

export interface PabloInput {
  persona: 'pablo'
  stage: 'requirements' | 'prd'
  projectId: string
  projectName: string
  githubRepo: string
  conversationHistory?: MessageRecord[]
  rawRequirements?: string
  existingRequirements?: string
}

export interface StellaSprintInput {
  persona: 'stella'
  stage: 'planning'
  projectId: string
  sprintId: string
  projectName: string
  prdContent: string
  priorRetro?: string
  carryForwardStories?: StoryRecord[]
  githubRepo: string
}

export interface StellaRetroInput {
  persona: 'stella'
  stage: 'retro'
  projectId: string
  sprintId: string
  projectName: string
  sprintNumber: number
  completedStories: StoryRecord[]
  githubRepo: string
}

export interface ViktorInput {
  persona: 'viktor'
  stage: 'development'
  projectId: string
  sprintId: string
  stories: StoryRecord[]
  sprintPlan: string
  featureBranch: string
  githubRepo: string
  githubToken: string
  workspaceDir?: string
}

export interface RexInput {
  persona: 'rex'
  stage: 'review'
  projectId: string
  sprintId: string
  prUrl: string
  prdContent: string
  sprintPlan: string
  githubRepo: string
  githubToken: string
}

export interface QuinnInput {
  persona: 'quinn'
  stage: 'qa'
  projectId: string
  sprintId: string
  featureBranch: string
  githubRepo: string
  githubToken: string
  testReportFromReview?: string
  workspaceDir?: string
}

export interface DexInput {
  persona: 'dex'
  stage: 'deploy'
  projectId: string
  sprintId: string
  githubRepo: string
  featureBranch: string
  defaultBranch: string
  githubToken: string
  workspaceDir?: string
}

export interface MaxInput {
  persona: 'max'
  stage: 'development'
  projectId: string
  sprintId: string
  githubRepo: string
  githubToken: string
  featureBranch: string
}

export type AgentTaskInput =
  | PabloInput
  | StellaSprintInput
  | StellaRetroInput
  | ViktorInput
  | RexInput
  | QuinnInput
  | DexInput
  | MaxInput

// --- Output shape (returned from agent service) ---

export interface AgentTaskOutput {
  summary: string
  artifactsCreated: string[]
  storiesUpdated?: Array<{ storyId: string; newStatus: string }>
  errors?: string[]
}

// --- Supporting types ---

export interface StoryRecord {
  id: string
  title: string
  description?: string
  points?: number
  status: string
  acceptanceCriteria?: string
}

export interface MessageRecord {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  persona?: PersonaName
  toolCalls?: Array<{
    toolName: string
    input: Record<string, unknown>
    output?: string
    approved?: boolean
  }>
}
