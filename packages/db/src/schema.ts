import { pgTable, text, timestamp, integer, jsonb, pgEnum, primaryKey } from 'drizzle-orm/pg-core'
import { createId } from '@paralleldrive/cuid2'
import type { AdapterAccountType } from 'next-auth/adapters'

// ── Auth.js required tables ───────────────────────────────────────────────────
export const users = pgTable('users', {
  id:            text('id').primaryKey().$defaultFn(() => createId()),
  name:          text('name'),
  email:         text('email').unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image:         text('image'),
  githubLogin:   text('github_login'),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
})

export const accounts = pgTable(
  'accounts',
  {
    userId:            text('userId').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type:              text('type').$type<AdapterAccountType>().notNull(),
    provider:          text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token:     text('refresh_token'),
    access_token:      text('access_token'),
    expires_at:        integer('expires_at'),
    token_type:        text('token_type'),
    id_token:          text('id_token'),
    scope:             text('scope'),
    session_state:     text('session_state'),
  },
  (account) => [primaryKey({ columns: [account.provider, account.providerAccountId] })]
)
// ─────────────────────────────────────────────────────────────────────────────

export const projectStatusEnum   = pgEnum('project_status',    ['active', 'archived'])
export const sprintStatusEnum    = pgEnum('sprint_status',     ['planning', 'setup', 'development', 'review', 'qa', 'deploying', 'complete'])
export const storyStatusEnum     = pgEnum('story_status',      ['todo', 'in_progress', 'done'])
export const artifactTypeEnum    = pgEnum('artifact_type',     ['requirements', 'prd', 'sprint-plan', 'test-report', 'review', 'retro', 'deploy-url'])
export const personaEnum         = pgEnum('persona',           ['pablo', 'stella', 'viktor', 'rex', 'quinn', 'dex', 'max'])
export const stageEnum           = pgEnum('stage',             ['requirements', 'prd', 'planning', 'setup', 'development', 'review', 'qa', 'deploy', 'retro'])
export const agentTaskStatusEnum = pgEnum('agent_task_status', ['pending', 'running', 'completed', 'failed', 'cancelled'])

export const projects = pgTable('projects', {
  id:            text('id').primaryKey().$defaultFn(() => createId()),
  userId:        text('user_id').notNull(),
  name:          text('name').notNull(),
  description:   text('description'),
  githubRepo:    text('github_repo').notNull(),
  defaultBranch: text('default_branch').notNull().default('main'),
  status:        projectStatusEnum('status').notNull().default('active'),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
  updatedAt:     timestamp('updated_at').notNull().defaultNow(),
})

export const sprints = pgTable('sprints', {
  id:            text('id').primaryKey().$defaultFn(() => createId()),
  projectId:     text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  number:        integer('number').notNull(),
  goal:          text('goal'),
  status:        sprintStatusEnum('status').notNull().default('planning'),
  featureBranch: text('feature_branch'),
  prUrl:         text('pr_url'),
  deployUrl:     text('deploy_url'),
  createdAt:     timestamp('created_at').notNull().defaultNow(),
  completedAt:   timestamp('completed_at'),
})

export const stories = pgTable('stories', {
  id:                 text('id').primaryKey().$defaultFn(() => createId()),
  sprintId:           text('sprint_id').notNull().references(() => sprints.id, { onDelete: 'cascade' }),
  title:              text('title').notNull(),
  description:        text('description'),
  points:             integer('points'),
  status:             storyStatusEnum('status').notNull().default('todo'),
  acceptanceCriteria: text('acceptance_criteria'),
  order:              integer('order').notNull().default(0),
})

export const agentTasks = pgTable('agent_tasks', {
  id:          text('id').primaryKey().$defaultFn(() => createId()),
  projectId:   text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sprintId:    text('sprint_id').references(() => sprints.id, { onDelete: 'cascade' }),
  stage:       stageEnum('stage').notNull(),
  persona:     personaEnum('persona').notNull(),
  status:      agentTaskStatusEnum('status').notNull().default('pending'),
  input:       jsonb('input').notNull().default({}),
  output:      jsonb('output').default({}),
  error:       text('error'),
  sessionId:   text('session_id'),
  startedAt:   timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt:   timestamp('created_at').notNull().defaultNow(),
})

export const artifacts = pgTable('artifacts', {
  id:        text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sprintId:  text('sprint_id').references(() => sprints.id, { onDelete: 'cascade' }),
  type:      artifactTypeEnum('type').notNull(),
  content:   text('content').notNull().default(''),
  commitSha: text('commit_sha'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const conversations = pgTable('conversations', {
  id:        text('id').primaryKey().$defaultFn(() => createId()),
  projectId: text('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  sprintId:  text('sprint_id').references(() => sprints.id, { onDelete: 'cascade' }),
  stage:     stageEnum('stage').notNull(),
  persona:   personaEnum('persona').notNull(),
  messages:  jsonb('messages').notNull().default([]),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
