'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PERSONA_COLOURS, PERSONA_DISPLAY_NAMES } from '@/lib/persona-constants'
import type { PersonaName, SSEEvent } from '@scrumbs/types'
import { PersonaMessage } from '@/components/persona-message'

interface StageWorkspaceProps {
  projectId: string
  sprintId?: string
  personaName: PersonaName
  stage: string
  input: Record<string, unknown>
  artifactTitle?: string
  onComplete?: (output: unknown) => void
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'done' | 'error'

export function StageWorkspace({
  projectId,
  sprintId,
  personaName,
  stage,
  input,
  artifactTitle,
  onComplete,
}: StageWorkspaceProps) {
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])
  const [artifact, setArtifact] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  const colour = PERSONA_COLOURS[personaName]
  const displayName = PERSONA_DISPLAY_NAMES[personaName]

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleStart = useCallback(async () => {
    setStatus('connecting')
    setError(null)
    setMessages([])
    setArtifact(null)

    try {
      // Fetch agent service URL
      const configRes = await fetch('/api/config')
      if (!configRes.ok) throw new Error('Failed to load config')
      const { agentServiceUrl } = await configRes.json()

      // Create the agent task
      const taskRes = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName,
          sprintId,
          input: { ...input, stage },
        }),
      })
      if (!taskRes.ok) {
        const err = await taskRes.json().catch(() => ({ error: 'Task creation failed' }))
        throw new Error(err.error ?? 'Task creation failed')
      }

      const { taskId: tid, sessionId } = await taskRes.json()
      setTaskId(tid)

      // Connect to SSE stream
      const url = `${agentServiceUrl}/tasks/${tid}/stream?sessionId=${sessionId}`
      const es = new EventSource(url)

      es.onopen = () => setStatus('connected')

      es.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as SSEEvent
          if (event.type === 'message') {
            const payload = event.payload as { role?: string; content?: string }
            if (payload.content) {
              setMessages((prev) => [...prev, { role: payload.role ?? 'assistant', content: payload.content! }])
              // Use the longest assistant message as artifact content
              if (payload.role !== 'user' && payload.content.length > 200) {
                setArtifact(payload.content)
              }
            }
          }
          if (event.type === 'approval_required') {
            setPendingApproval(true)
          }
          if (event.type === 'done') {
            setStatus('done')
            es.close()
            const payload = event.payload as Record<string, unknown> | undefined
            onCompleteRef.current?.(payload)
          }
          if (event.type === 'error') {
            const payload = event.payload as { message?: string }
            setError(payload.message ?? 'An error occurred')
          }
          if (event.type === 'context_summary') {
            const payload = event.payload as { content?: string }
            if (payload.content) {
              setMessages((prev) => [...prev, { role: 'assistant', content: payload.content! }])
              if (payload.content.length > 200) {
                setArtifact(payload.content)
              }
            }
          }
        } catch {
          // ignore malformed events
        }
      }

      es.onerror = () => {
        setStatus((prev) => (prev === 'done' ? 'done' : 'error'))
        es.close()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }, [projectId, sprintId, personaName, stage, input])

  const statusDot = {
    idle: 'bg-slate-500',
    connecting: 'bg-amber-400 animate-pulse',
    connected: 'bg-green-400',
    done: 'bg-green-400',
    error: 'bg-red-400',
  }[status]

  return (
    <div className="flex h-full">
      {/* Conversation Panel */}
      <div className="flex-1 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusDot}`} />
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colour }} />
          <span className="font-medium">{displayName}</span>
          <span className="ml-auto text-xs text-slate-500 capitalize">{stage}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && status === 'idle' && (
            <p className="text-slate-400 text-sm">
              {displayName} will help you with {stage}. Click the button below to begin.
            </p>
          )}
          {messages.map((msg, i) => (
            <PersonaMessage
              key={i}
              personaName={personaName}
              content={msg.content}
              requiresApproval={pendingApproval && i === messages.length - 1}
              taskId={taskId ?? undefined}
            />
          ))}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        {status === 'idle' && (
          <div className="p-4 border-t border-slate-800">
            <button
              onClick={handleStart}
              className="w-full py-2 text-white font-semibold rounded-lg transition-colors"
              style={{ backgroundColor: colour }}
            >
              Start with {displayName}
            </button>
          </div>
        )}
        {status === 'connecting' && (
          <div className="p-4 border-t border-slate-800 text-center text-sm text-slate-500">
            Connecting...
          </div>
        )}
      </div>
      {/* Artifact Panel */}
      <div className="w-1/2 p-6 overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 text-slate-300">{artifactTitle ?? stage}</h2>
        {artifact ? (
          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap text-slate-200">
            {artifact}
          </div>
        ) : (
          <p className="text-slate-500 text-sm">
            {status === 'idle'
              ? `${artifactTitle ?? stage} will appear here as ${displayName} works.`
              : `Waiting for ${displayName}...`}
          </p>
        )}
      </div>
    </div>
  )
}
