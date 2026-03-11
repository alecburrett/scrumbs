// Standalone migration runner — uses our own postgres.js with SSL explicitly
// configured. Bypasses drizzle-kit CLI which creates its own internal client
// without exposing SSL options.
//
// Run from project root: node packages/db/migrate.mjs
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const url = process.env.DATABASE_URL
if (!url) {
  console.error('DATABASE_URL is not set')
  process.exit(1)
}

const client = postgres(url, {
  max: 1,
  ssl: { rejectUnauthorized: false },
})

const db = drizzle(client)

console.log('Running migrations...')
await migrate(db, { migrationsFolder: join(__dirname, 'src/migrations') })
console.log('Migrations complete')

await client.end()
process.exit(0)
