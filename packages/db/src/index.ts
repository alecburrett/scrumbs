import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type Schema = typeof schema
type DB = PostgresJsDatabase<Schema>

let _db: DB | undefined

function createDb(): DB {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  return drizzle(postgres(url, { max: 10 }), { schema })
}

// Lazy proxy — connection only created on first property access (request time, not build time)
export const db = new Proxy({} as DB, {
  get(_, prop: string | symbol) {
    if (!_db) _db = createDb()
    return (_db as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export * from './schema'
