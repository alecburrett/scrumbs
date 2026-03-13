import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error('DATABASE_URL environment variable is required')

  const client = postgres(connectionString, { max: 1, ssl: { rejectUnauthorized: false } })
  const db = drizzle(client)

  console.log('Running migrations...')
  await migrate(db, { migrationsFolder: path.join(__dirname, '../drizzle') })
  console.log('Migrations complete')
  await client.end()
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
