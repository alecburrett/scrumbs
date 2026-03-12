'use client'

import { useEffect, useRef, useState } from 'react'
import type { SSEEvent } from '@scrumbs/types'
import { PersonaMessage } from './persona-message'

interface ConversationPanelProps {
  taskId: string
  sessionId: string
  agentServiceUrl: string
  personaName: string
}

export function ConversationPanel({
  taskId,
  sessionId,
  agentServiceUrl,
  personaName,
}: ConversationPanelProps) {
  const [events, setEvents] = useState<SSEEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [done, setDone] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const url = `${agentServiceUrl}/tasks/${taskId}/stream?sessionId=${sessionId}`
    const es = new EventSource(url)

    es.onopen = () => setConnected(true)

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as SSEEvent
        setEvents((prev) => [...prev, event])
        if (event.type === 'done') {
          setDone(true)
          es.close()
        }
      } catch {
        // ignore parse errors
      }
    }

    es.onerror = () => {
      setConnected(false)
      // EventSource auto-reconnects
    }

    return () => es.close()
  }, [taskId, sessionId, agentServiceUrl])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events])

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 p-2 text-xs text-slate-500">
        <span
          className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-amber-400'}`}
        />
        {connected ? 'Connected' : 'Connecting…'}
        {done && ' · Complete'}
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 p-4">
        {events
          .filter((e) => e.type === 'message' || e.type === 'approval_required')
          .map((event, i) => (
            <PersonaMessage
              key={i}
              personaName={personaName as any}
              content={
                typeof (event.payload as any)?.message === 'string'
                  ? (event.payload as any).message
                  : JSON.stringify(event.payload)
              }
              requiresApproval={event.type === 'approval_required'}
              taskId={taskId}
            />
          ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
