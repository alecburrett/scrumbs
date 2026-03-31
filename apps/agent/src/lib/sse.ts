import type { ServerResponse } from 'node:http'
import type { SSEEvent } from '@scrumbs/types'

const MAX_BUFFER_SIZE = 200
const BUFFER_TTL_MS = 30 * 60 * 1000 // 30 minutes

const buffers = new Map<string, SSEEvent[]>()
const bufferTimestamps = new Map<string, number>()

function pruneExpiredBuffers(): void {
  if (Math.random() > 0.02) return // Only prune on ~2% of calls to reduce overhead
  const now = Date.now()
  for (const [sessionId, ts] of bufferTimestamps) {
    if (now - ts > BUFFER_TTL_MS) {
      buffers.delete(sessionId)
      bufferTimestamps.delete(sessionId)
    }
  }
}

/**
 * Buffer an event for a session even if no SSE connection exists yet.
 * Capped at MAX_BUFFER_SIZE events per session; sessions expire after 30 minutes.
 */
export function bufferEvent(sessionId: string, event: SSEEvent): void {
  pruneExpiredBuffers()

  let buf = buffers.get(sessionId)
  if (!buf) {
    buf = []
    buffers.set(sessionId, buf)
  }
  bufferTimestamps.set(sessionId, Date.now())

  // Evict the oldest event to make room so the newest events (including done/error) are always replayable
  if (buf.length >= MAX_BUFFER_SIZE) {
    buf.shift()
  }
  buf.push(event)
}

export class SSEEmitter {
  constructor(
    private readonly sessionId: string,
    private readonly res: ServerResponse
  ) {}

  emit(event: SSEEvent): void {
    // Buffer for replay on reconnect
    bufferEvent(this.sessionId, event)
    // Write to current connection
    this.res.write(`data: ${JSON.stringify(event)}\n\n`)
  }

  static replay(sessionId: string, res: ServerResponse): void {
    const events = buffers.get(sessionId) ?? []
    for (const event of events) {
      res.write(`data: ${JSON.stringify(event)}\n\n`)
    }
  }

  static clearBuffer(sessionId: string): void {
    buffers.delete(sessionId)
    bufferTimestamps.delete(sessionId)
  }
}
