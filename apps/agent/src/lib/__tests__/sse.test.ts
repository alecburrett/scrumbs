import { describe, it, expect } from 'vitest'
import { SSEEmitter } from '../sse.js'
import { Writable } from 'node:stream'
import type { ServerResponse } from 'node:http'

function mockRes(): ServerResponse & { chunks: string[] } {
  const chunks: string[] = []
  const writable = new Writable({
    write(chunk, _enc, cb) { chunks.push(chunk.toString()); cb() },
  })
  return Object.assign(writable, { chunks }) as unknown as ServerResponse & { chunks: string[] }
}

describe('SSEEmitter', () => {
  it('emits events and buffers them', () => {
    const res = mockRes()
    const emitter = new SSEEmitter('sess-1', res)
    emitter.emit({ type: 'message', taskId: 't1', sessionId: 'sess-1', payload: 'hello', timestamp: '' })
    expect(res.chunks.length).toBe(1)
    expect(res.chunks[0]).toContain('"type":"message"')
  })

  it('replays buffered events to a new connection', () => {
    const res1 = mockRes()
    const emitter = new SSEEmitter('sess-2', res1)
    emitter.emit({ type: 'message', taskId: 't2', sessionId: 'sess-2', payload: 'first', timestamp: '' })
    emitter.emit({ type: 'done', taskId: 't2', sessionId: 'sess-2', payload: {}, timestamp: '' })

    const res2 = mockRes()
    SSEEmitter.replay('sess-2', res2)
    expect(res2.chunks.length).toBe(2)
  })

  it('clearBuffer removes session data', () => {
    const res = mockRes()
    const emitter = new SSEEmitter('sess-3', res)
    emitter.emit({ type: 'message', taskId: 't3', sessionId: 'sess-3', payload: 'x', timestamp: '' })
    SSEEmitter.clearBuffer('sess-3')

    const res2 = mockRes()
    SSEEmitter.replay('sess-3', res2)
    expect(res2.chunks.length).toBe(0)
  })
})
