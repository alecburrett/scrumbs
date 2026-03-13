import type { ServerResponse } from 'node:http'
import type { SSEEvent } from '@scrumbs/types'

const buffers = new Map<string, SSEEvent[]>()

export class SSEEmitter {
  constructor(
    private readonly sessionId: string,
    private readonly res: ServerResponse
  ) {
    if (!buffers.has(sessionId)) {
      buffers.set(sessionId, [])
    }
  }

  emit(event: SSEEvent): void {
    const buffer = buffers.get(this.sessionId)
    if (buffer) {
      buffer.push(event)
    }
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
