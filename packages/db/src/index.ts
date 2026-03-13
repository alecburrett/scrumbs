import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as authSchema from './schema/auth.js'
import * as projectsSchema from './schema/projects.js'
import * as agentTasksSchema from './schema/agent-tasks.js'

const schema = {
  ...authSchema,
  ...projectsSchema,
  ...agentTasksSchema,
}

function createDb(connectionString: string) {
  const client = postgres(connectionString)
  return drizzle(client, { schema })
}

export type Db = ReturnType<typeof createDb>

export { createDb }
export * from './schema/auth.js'
export * from './schema/projects.js'
export * from './schema/agent-tasks.js'
