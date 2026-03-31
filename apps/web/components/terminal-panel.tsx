'use client'

import { useEffect, useRef, useState } from 'react'
import type { SSEEvent } from '@scrumbs/types'
import { TerminalEventRow } from './terminal-event'
import { ApprovalGateBanner } from './approval-gate-banner'

interface TerminalPanelProps {
  projectId: string
  taskId: string
  sessionId: string
  onStoryStatus?: (storyId: string, status: string) => void
  onDone?: () => void
}

export function TerminalPanel({
  projectId,
  taskId,
  sessionId,
  onStoryStatus,
  onDone,
}: TerminalPanelProps) {
  const [events, setEvents] = useState<SSEEvent[]>([])
  const [pendingApproval, setPendingApproval] = useState(false)
  const [connected, setConnected] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const onStoryStatusRef = useRef(onStoryStatus)
  const onDoneRef = useRef(onDone)
  useEffect(() => { onStoryStatusRef.current = onStoryStatus })
  useEffect(() => { onDoneRef.current = onDone })

  useEffect(() => {
    // Use the server-side proxy — secret is added server-side and never sent to the browser
    const url = `/api/projects/${projectId}/tasks/${taskId}/stream?sessionId=${sessionId}`
    const es = new EventSource(url)

    es.onopen = () => setConnected(true)

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as SSEEvent
        if (event.type === 'story_status') {
          const p = event.payload as { storyId: string; status: string }
          onStoryStatusRef.current?.(p.storyId, p.status)
          return
        }
        if (event.type === 'approval_required') {
          setPendingApproval(true)
        }
        if (event.type === 'done') {
          es.close()
          onDoneRef.current?.()
        }
        setEvents((prev) => [...prev, event])
      } catch {}
    }

    es.onerror = () => setConnected(false)

    return () => es.close()
  }, [projectId, taskId, sessionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [events])

  const displayEvents = events.filter((e) => e.type !== 'story_status')

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-lg border border-slate-800">
      <div className="px-4 py-2 border-b border-slate-800 flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400' : 'bg-amber-400'}`} />
        <span className="text-xs text-slate-400 font-mono">Viktor — terminal</span>
      </div>
      {pendingApproval && (
        <ApprovalGateBanner
          taskId={taskId}
          onResolved={() => setPendingApproval(false)}
        />
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 font-mono text-sm">
        {displayEvents.map((event, i) => (
          <TerminalEventRow key={i} event={event} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
