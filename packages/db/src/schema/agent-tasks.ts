import { pgTable, text, timestamp, integer, pgEnum, jsonb } from 'drizzle-orm/pg-core'
import { sprints } from './projects.js'

export const agentTaskStatusEnum = pgEnum('agent_task_status', [
  'pending',
  'running',
  'waiting_approval',
  'completed',
  'failed',
  'cancelled',
])

export const artifactStatusEnum = pgEnum('artifact_status', ['active', 'superseded'])

export const artifactTypeEnum = pgEnum('artifact_type', [
  'requirements',
  'prd',
  'sprint-plan',
  'code-review',
  'qa-report',
  'deploy-log',
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

export const agentTasks = pgTable('agent_task', {
  id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  sprintId: text('sprint_id')
    .notNull()
    .references(() => sprints.id, { onDelete: 'cascade' }),
  personaName: personaNameEnum('persona_name').notNull(),
  status: agentTaskStatusEnum('status').notNull().default('pending'),
  sessionId: text('session_id'),
  inputJson: jsonb('input_json'),
  outputJson: jsonb('output_json'),
  errorMessage: text('error_message'),
  tokensBudget: integer('tokens_budget').notNull().default(150000),
  tokensUsed: integer('tokens_used').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
})

export const artifacts = pgTable('artifact', {
  id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  agentTaskId: text('agent_task_id')
    .notNull()
    .references(() => agentTasks.id, { onDelete: 'cascade' }),
  sprintId: text('sprint_id')
    .notNull()
    .references(() => sprints.id, { onDelete: 'cascade' }),
  type: artifactTypeEnum('type').notNull(),
  contentMd: text('content_md').notNull(),
  status: artifactStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const conversations = pgTable('conversation', {
  id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  agentTaskId: text('agent_task_id')
    .notNull()
    .references(() => agentTasks.id, { onDelete: 'cascade' }),
  role: text('role').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
