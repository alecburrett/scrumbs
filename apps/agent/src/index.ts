import Fastify from 'fastify'
import { timingSafeEqual } from 'node:crypto'
import { createDb } from '@scrumbs/db'
import { taskRoutes } from './routes/tasks.js'

// Fail fast if required env vars are missing
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL environment variable is required')
if (!process.env.AGENT_SERVICE_SECRET) throw new Error('AGENT_SERVICE_SECRET environment variable is required')

const fastify = Fastify({ logger: true })

// Auth hook — validates shared secret on all routes except /health
fastify.addHook('preHandler', async (request, reply) => {
  if (request.url === '/health') return

  const raw = request.headers['x-agent-secret']
  const provided = Array.isArray(raw) ? raw[0] : raw
  const expected = process.env.AGENT_SERVICE_SECRET!

  if (!provided) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }

  const providedBuf = Buffer.from(provided)
  const expectedBuf = Buffer.from(expected)

  // timingSafeEqual requires equal-length buffers; length mismatch is safe to reveal
  if (providedBuf.length !== expectedBuf.length || !timingSafeEqual(providedBuf, expectedBuf)) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
})

fastify.get('/health', async () => ({ status: 'ok' }))

const db = createDb(process.env.DATABASE_URL)
await fastify.register(taskRoutes, { prefix: '/tasks', db })

const port = Number(process.env.PORT ?? 3001)
await fastify.listen({ port, host: '0.0.0.0' })
