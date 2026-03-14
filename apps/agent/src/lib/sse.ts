import type { ServerResponse } from 'node:http'
import type { SSEEvent } from '@scrumbs/types'

const buffers = new Map<string, SSEEvent[]>()

/**
 * Buffer an event for a session even if no SSE connection exists yet.
 * This ensures events emitted before the browser connects are not lost.
 */
export function bufferEvent(sessionId: string, event: SSEEvent): void {
  let buf = buffers.get(sessionId)
  if (!buf) {
    buf = []
    buffers.set(sessionId, buf)
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
  }
}
