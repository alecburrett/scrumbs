import type { FastifyPluginAsync } from 'fastify'
import type { Db } from '@scrumbs/db'
import { agentTasks } from '@scrumbs/db'
import { eq } from 'drizzle-orm'
import { randomUUID } from 'node:crypto'
import { runAgentTask, registerEmitter, unregisterEmitter } from '../lib/agent-loop.js'
import { SSEEmitter } from '../lib/sse.js'
import { resolveApproval } from '../lib/approval.js'

export const taskRoutes: FastifyPluginAsync<{ db: Db }> = async (fastify, opts) => {
  const { db } = opts

  // POST /tasks — create and start a task
  fastify.post<{ Body: { sprintId: string; personaName: string; input: unknown } }>(
    '/',
    async (request, reply) => {
      const { sprintId, personaName, input } = request.body
      const sessionId = randomUUID()

      const [task] = await db
        .insert(agentTasks)
        .values({
          sprintId,
          personaName: personaName as any,
          sessionId,
          inputJson: input as any,
        })
        .returning()

      // Fire and forget — agent loop runs asynchronously
      runAgentTask(task.id, db).catch((err) => {
        fastify.log.error({ taskId: task.id, err }, 'Agent task failed')
      })

      return reply.status(202).send({ taskId: task.id, sessionId })
    }
  )

  // GET /tasks/:id/stream — SSE stream
  fastify.get<{ Params: { id: string }; Querystring: { sessionId?: string } }>(
    '/:id/stream',
    async (request, reply) => {
      const { id } = request.params
      const { sessionId } = request.query

      reply.raw.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })

      const sid = sessionId ?? id

      // Replay FIRST, then register — prevents out-of-order events
      SSEEmitter.replay(sid, reply.raw)

      const emitter = new SSEEmitter(sid, reply.raw)
      registerEmitter(id, emitter)

      const keepAlive = setInterval(() => {
        reply.raw.write(': keep-alive\n\n')
      }, 15000)

      // Resolve on close — don't hang forever
      await new Promise<void>((resolve) => {
        request.socket.on('close', () => {
          clearInterval(keepAlive)
          unregisterEmitter(id)
          resolve()
        })
      })
    }
  )

  // POST /tasks/:id/approve
  fastify.post<{ Params: { id: string } }>('/:id/approve', async (request, reply) => {
    const { id } = request.params
    resolveApproval(id, true)
    return reply.send({ ok: true })
  })

  // POST /tasks/:id/cancel
  fastify.post<{ Params: { id: string } }>('/:id/cancel', async (request, reply) => {
    const { id } = request.params

    await db
      .update(agentTasks)
      .set({ status: 'cancelled' })
      .where(eq(agentTasks.id, id))

    resolveApproval(id, false) // unblock any waiting approval gate

    return reply.send({ ok: true })
  })
}
