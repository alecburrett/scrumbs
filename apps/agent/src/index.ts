import Fastify from 'fastify'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { createDb } from '@scrumbs/db'
import { taskRoutes } from './routes/tasks.js'

// Fail fast if required env vars are missing
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL environment variable is required')
if (!process.env.AGENT_SERVICE_SECRET || process.env.AGENT_SERVICE_SECRET.length < 32) {
  throw new Error('AGENT_SERVICE_SECRET environment variable is required and must be at least 32 characters')
}

// Generate a random HMAC key once at startup — used to hash both sides of the
// secret comparison so timingSafeEqual always receives equal-length digests and
// the expected secret length is never leaked via timing.
const HMAC_KEY = randomBytes(32)

const fastify = Fastify({ logger: true })

// Auth hook — validates shared secret on all routes except /health
fastify.addHook('preHandler', async (request, reply) => {
  if (request.url === '/health') return

  const raw = request.headers['x-agent-secret']
  if (Array.isArray(raw)) {
    return reply.status(400).send({ error: 'Bad Request' })
  }
  const provided = raw
  const expected = process.env.AGENT_SERVICE_SECRET!

  if (!provided) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }

  const providedBuf = createHmac('sha256', HMAC_KEY).update(provided).digest()
  const expectedBuf = createHmac('sha256', HMAC_KEY).update(expected).digest()

  if (!timingSafeEqual(providedBuf, expectedBuf)) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
})

fastify.get('/health', async () => ({ status: 'ok' }))

const db = createDb(process.env.DATABASE_URL)
await fastify.register(taskRoutes, { prefix: '/tasks', db })

const port = Number(process.env.PORT ?? 3001)
await fastify.listen({ port, host: '0.0.0.0' })
