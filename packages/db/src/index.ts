import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as authSchema from './schema/auth.js'
import * as projectsSchema from './schema/projects.js'
import * as agentTasksSchema from './schema/agent-tasks.js'

const schema = { ...authSchema, ...projectsSchema, ...agentTasksSchema }

// Singleton cache keyed by connection string
const instances = new Map<string, ReturnType<typeof drizzle>>()

export function createDb(connectionString: string) {
  const existing = instances.get(connectionString)
  if (existing) return existing

  const client = postgres(connectionString, { max: 10, idle_timeout: 20, ssl: { rejectUnauthorized: false } })
  const db = drizzle(client, { schema })
  instances.set(connectionString, db)
  return db
}

export type Db = ReturnType<typeof createDb>

export { createDb }
export * from './schema/auth.js'
export * from './schema/projects.js'
export * from './schema/agent-tasks.js'
