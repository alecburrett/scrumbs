import { pgTable, text, timestamp, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core'
import { projects, sprints } from './projects.js'

export const agentTaskStatusEnum = pgEnum('agent_task_status', [
  'pending',
  'running',
  'waiting_approval',
  'completed',
  'failed',
  'cancelled',
])

export const artifactStatusEnum = pgEnum('artifact_status', ['current', 'superseded'])

export const artifactTypeEnum = pgEnum('artifact_type', [
  'requirements',
  'prd',
  'sprint-plan',
  'test-report',
  'review',
  'deploy-record',
  'retro',
])

export const personaNameEnum = pgEnum('persona_name', [
  'pablo',
  'stella',
  'viktor',
  'rex',
  'quinn',
  'dex',
  'max',
])

export const stageEnum = pgEnum('stage', [
  'requirements',
  'prd',
  'planning',
  'development',
  'review',
  'qa',
  'deploy',
  'retro',
])

export const agentTasks = pgTable('agent_task', {
  id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  sprintId: text('sprint_id')
    .references(() => sprints.id, { onDelete: 'cascade' }),
  stage: stageEnum('stage').notNull(),
  personaName: personaNameEnum('persona_name').notNull(),
  status: agentTaskStatusEnum('status').notNull().default('pending'),
  sessionId: text('session_id').unique(),
  inputJson: jsonb('input_json'),
  outputJson: jsonb('output_json'),
  errorMessage: text('error_message'),
  tokensBudget: integer('tokens_budget').notNull().default(100000),
  tokensUsed: integer('tokens_used').notNull().default(0),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
})

export const artifacts = pgTable('artifact', {
  id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  agentTaskId: text('agent_task_id')
    .notNull()
    .references(() => agentTasks.id, { onDelete: 'cascade' }),
  sprintId: text('sprint_id')
    .references(() => sprints.id, { onDelete: 'cascade' }),
  type: artifactTypeEnum('type').notNull(),
  contentMd: text('content_md').notNull(),
  commitSha: text('commit_sha'),
  status: artifactStatusEnum('status').notNull().default('current'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
})

export const conversations = pgTable('conversation', {
  id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  sprintId: text('sprint_id')
    .references(() => sprints.id, { onDelete: 'cascade' }),
  stage: stageEnum('stage').notNull(),
  persona: personaNameEnum('persona').notNull(),
  messages: jsonb('messages').notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
