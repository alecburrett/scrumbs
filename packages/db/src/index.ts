import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as authSchema from './schema/auth'
import * as projectsSchema from './schema/projects'
import * as agentTasksSchema from './schema/agent-tasks'

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
export * from './schema/auth'
export * from './schema/projects'
export * from './schema/agent-tasks'
