import { pgTable, text, timestamp, integer, pgEnum, unique } from 'drizzle-orm/pg-core'
import { users } from './auth.js'

export const projectStatusEnum = pgEnum('project_status', ['active', 'archived'])

export const sprintStatusEnum = pgEnum('sprint_status', [
  'planning',
  'development',
  'review',
  'qa',
  'deploying',
  'complete',
])

export const storyStatusEnum = pgEnum('story_status', [
  'todo',
  'in_progress',
  'done',
])

export const projects = pgTable('project', {
  id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  description: text('description'),
  githubRepo: text('github_repo').notNull(),
  githubOwner: text('github_owner').notNull(),
  defaultBranch: text('default_branch').notNull().default('main'),
  status: projectStatusEnum('status').notNull().default('active'),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().$defaultFn(() => new Date()).$onUpdate(() => new Date()),
})

export const sprints = pgTable('sprint', {
  id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  number: integer('number').notNull(),
  goal: text('goal'),
  status: sprintStatusEnum('status').notNull().default('planning'),
  featureBranch: text('feature_branch'),
  prUrl: text('pr_url'),
  deployUrl: text('deploy_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
}, (t) => ({
  projectNumberUnique: unique().on(t.projectId, t.number),
}))

export const stories = pgTable('story', {
  id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  sprintId: text('sprint_id')
    .notNull()
    .references(() => sprints.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  points: integer('points'),
  acceptanceCriteria: text('acceptance_criteria'),
  status: storyStatusEnum('status').notNull().default('todo'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
