import Fastify from 'fastify'
import { createDb } from '@scrumbs/db'
import { taskRoutes } from './routes/tasks.js'

const fastify = Fastify({ logger: true })

// Auth hook — validates shared secret
fastify.addHook('preHandler', async (request, reply) => {
  // Health check is unauthenticated
  if (request.url === '/health') return

  const secret = request.headers['x-agent-secret']
  if (!secret || secret !== process.env.AGENT_SERVICE_SECRET) {
    reply.status(401).send({ error: 'Unauthorized' })
  }
})

// Health check
fastify.get('/health', async () => ({ status: 'ok' }))

// Task routes
const db = createDb(process.env.DATABASE_URL!)
await fastify.register(taskRoutes, { prefix: '/tasks', db })

const port = Number(process.env.PORT ?? 3001)
await fastify.listen({ port, host: '0.0.0.0' })
