import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type Schema = typeof schema
type DB = PostgresJsDatabase<Schema>

function createDb(): DB {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  return drizzle(postgres(url, { max: 10 }), { schema })
}

export const db: DB = createDb()

export * from './schema'
