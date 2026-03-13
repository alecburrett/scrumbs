import { pgTable, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './auth'

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
  'in-progress',
  'done',
])

export const projects = pgTable('project', {
  id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  githubRepo: text('github_repo').notNull(),
  githubOwner: text('github_owner').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const sprints = pgTable('sprint', {
  id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  number: integer('number').notNull(),
  status: sprintStatusEnum('status').notNull().default('planning'),
  featureBranch: text('feature_branch'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
})

export const stories = pgTable('story', {
  id: text('id').notNull().primaryKey().$defaultFn(() => crypto.randomUUID()),
  sprintId: text('sprint_id')
    .notNull()
    .references(() => sprints.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: storyStatusEnum('status').notNull().default('todo'),
  order: integer('order').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
