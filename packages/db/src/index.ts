import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

type Schema = typeof schema
type DB = PostgresJsDatabase<Schema>

let _db: DB | undefined

export function getDb(): DB {
  if (!_db) {
    const url = process.env.DATABASE_URL
    if (!url) throw new Error('DATABASE_URL is not set')
    _db = drizzle(postgres(url, { max: 10, ssl: 'require' }), { schema })
  }
  return _db
}

// Lazy proxy for general use — defers connection to first property access (request time)
export const db = new Proxy({} as DB, {
  get(_, prop: string | symbol) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export * from './schema'
