import { createDb } from '@scrumbs/db'

// Use a placeholder during build (DATABASE_URL unavailable at build time in Next.js)
export const db = createDb(process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost:5432/placeholder')
