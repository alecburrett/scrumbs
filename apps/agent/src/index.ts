import Fastify from 'fastify'
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { createDb } from '@scrumbs/db'
import { taskRoutes } from './routes/tasks.js'

// Side-effect imports — tool files self-register via registerTool()
import './lib/tools/read-file.js'
import './lib/tools/write-file.js'
import './lib/tools/run-tests.js'
import './lib/tools/bash.js'
import './lib/tools/git-commit.js'
import './lib/tools/git-push.js'

// Fail fast if required env vars are missing
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL environment variable is required')
if (!process.env.AGENT_SERVICE_SECRET || process.env.AGENT_SERVICE_SECRET.length < 32) {
  throw new Error('AGENT_SERVICE_SECRET environment variable is required and must be at least 32 characters')
}
if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY environment variable is required')

// Generate a random HMAC key once at startup — used to hash both sides of the
// secret comparison so timingSafeEqual always receives equal-length digests and
// the expected secret length is never leaked via timing.
const HMAC_KEY = randomBytes(32)
// Pre-hash the expected secret once — safe because the startup validation above
// guarantees AGENT_SERVICE_SECRET is present and meets the length requirement.
const EXPECTED_BUF = createHmac('sha256', HMAC_KEY)
  .update(process.env.AGENT_SERVICE_SECRET!)
  .digest()

const fastify = Fastify({ logger: true })

// Auth hook — validates shared secret on all routes except /health
fastify.addHook('preHandler', async (request, reply) => {
  if (request.routeOptions?.url === '/health') return

  // Accept secret from header (server-to-server) or query param (browser EventSource)
  const headerVal = request.headers['x-agent-secret']
  if (Array.isArray(headerVal)) {
    return reply.status(400).send({ error: 'Bad Request' })
  }
  const queryVal = (request.query as Record<string, string | undefined>)?.secret
  const raw = headerVal ?? queryVal

  if (!raw) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }

  const providedBuf = createHmac('sha256', HMAC_KEY).update(raw).digest()
  if (!timingSafeEqual(providedBuf, EXPECTED_BUF)) {
    return reply.status(401).send({ error: 'Unauthorized' })
  }
})

fastify.get('/health', async () => ({ status: 'ok' }))

const db = createDb(process.env.DATABASE_URL)
await fastify.register(taskRoutes, { prefix: '/tasks', db })

const port = Number(process.env.PORT ?? 3001)
await fastify.listen({ port, host: '0.0.0.0' })
