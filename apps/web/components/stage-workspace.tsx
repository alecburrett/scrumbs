'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PERSONA_COLOURS, PERSONA_DISPLAY_NAMES } from '@/lib/persona-constants'
import type { PersonaName, SSEEvent } from '@scrumbs/types'
import { PersonaMessage } from '@/components/persona-message'
import { HandoffCard } from '@/components/handoff-card'
import { StepBackModal } from '@/components/step-back-modal'

const SPRINT_STAGES = ['planning', 'development', 'review', 'qa', 'deploy', 'retro'] as const

const STAGE_ORDER: Record<string, number> = {
  planning: 0,
  development: 1,
  review: 2,
  qa: 3,
  deploy: 4,
  retro: 5,
}

function getPriorStage(stage: string): string | null {
  const idx = STAGE_ORDER[stage]
  if (idx === undefined || idx <= 0) return null
  return SPRINT_STAGES[idx - 1]
}

interface StageWorkspaceProps {
  projectId: string
  sprintId?: string
  personaName: PersonaName
  stage: string
  input: Record<string, unknown>
  artifactTitle?: string
  onApprove?: (artifact: string | null, taskId: string | null) => Promise<void>
  /** Placeholder text for the user message input */
  inputPlaceholder?: string
  /** Previous persona for the handoff card */
  previousPersona?: PersonaName
}

type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'done' | 'error'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export function StageWorkspace({
  projectId,
  sprintId,
  personaName,
  stage,
  input,
  artifactTitle,
  onApprove,
  inputPlaceholder,
  previousPersona,
}: StageWorkspaceProps) {
  const router = useRouter()
  const [status, setStatus] = useState<ConnectionStatus>('idle')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [artifact, setArtifact] = useState<string | null>(null)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [pendingApproval, setPendingApproval] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [budgetWarning, setBudgetWarning] = useState<string | null>(null)
  const [showHandoff, setShowHandoff] = useState(!!previousPersona)
  const [showStepBack, setShowStepBack] = useState(false)
  const [userInput, setUserInput] = useState('')
  const [approving, setApproving] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  // Accumulate conversation history across tasks for multi-turn
  const conversationHistoryRef = useRef<ChatMessage[]>([])
  // Hold reference to the active EventSource so it can be closed on reconnect / unmount
  const esRef = useRef<EventSource | null>(null)

  const colour = PERSONA_COLOURS[personaName]
  const displayName = PERSONA_DISPLAY_NAMES[personaName]

  const isSprintStage = STAGE_ORDER[stage] !== undefined
  const priorStage = getPriorStage(stage)
  const priorStageLabel = priorStage
    ? priorStage.charAt(0).toUpperCase() + priorStage.slice(1)
    : ''
  const currentStageLabel = stage.charAt(0).toUpperCase() + stage.slice(1)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Close the EventSource when the component unmounts
  useEffect(() => {
    return () => { esRef.current?.close() }
  }, [])

  /** Fetch task output directly from DB as a fallback when SSE misses events */
  const fetchTaskOutput = useCallback(async (tid: string) => {
    try {
      const params = new URLSearchParams()
      if (sprintId) params.set('sprintId', sprintId)
      if (personaName) params.set('personaName', personaName)
      const res = await fetch(`/api/projects/${projectId}/active-task?${params.toString()}`)
      // If no active task, the task likely completed — check DB for output
      if (res.status === 404) {
        // Task completed before we could connect. Poll for the result.
        const taskRes = await fetch(`/api/projects/${projectId}/tasks/${tid}`)
        if (taskRes.ok) {
          const task = await taskRes.json()
          if (task.status === 'completed' && task.outputText) {
            setMessages((prev) => {
              // Don't duplicate if we already have assistant messages
              if (prev.some((m) => m.role === 'assistant')) return prev
              return [...prev, { role: 'assistant', content: task.outputText }]
            })
            if (task.outputText.length > 200) {
              setArtifact(task.outputText)
            }
            setStatus('done')
            return true
          }
        }
      }
    } catch {
      // ignore — SSE is the primary mechanism
    }
    return false
  }, [projectId, sprintId, personaName])

  // Connect to an existing SSE stream for a given task
  const connectToStream = useCallback((tid: string, sid: string) => {
    // Close any existing connection before opening a new one
    esRef.current?.close()
    esRef.current = null

    setTaskId(tid)
    setStatus('connecting')
    let receivedEvents = false

    // Use the server-side proxy — secret is added server-side and never sent to the browser
    const url = `/api/projects/${projectId}/tasks/${tid}/stream?sessionId=${sid}`
    const es = new EventSource(url)
    esRef.current = es

    // Fallback: if no events received within 5s, poll the DB
    const fallbackTimer = setTimeout(async () => {
      if (!receivedEvents) {
        const found = await fetchTaskOutput(tid)
        if (found) es.close()
      }
    }, 5000)

    es.onopen = () => setStatus('connected')

    es.onmessage = (e) => {
      receivedEvents = true
      try {
        const event = JSON.parse(e.data) as SSEEvent
        if (event.type === 'message') {
          const payload = event.payload as { role?: string; content?: string }
          if (payload.content) {
            const msg: ChatMessage = { role: (payload.role as 'user' | 'assistant') ?? 'assistant', content: payload.content }
            setMessages((prev) => [...prev, msg])
            // Track assistant messages for conversation history
            if (msg.role === 'assistant') {
              conversationHistoryRef.current.push(msg)
            }
            // Use longer responses as artifact content
            if (payload.role !== 'user' && payload.content.length > 200) {
              setArtifact(payload.content)
            }
          }
        }
        if (event.type === 'approval_required') {
          setPendingApproval(true)
        }
        if (event.type === 'done') {
          clearTimeout(fallbackTimer)
          setStatus('done')
          es.close()
        }
        if (event.type === 'error') {
          const payload = event.payload as { warning?: boolean; message?: string }
          if (payload.warning) {
            setBudgetWarning(payload.message ?? 'Token budget warning')
          } else {
            setError(payload.message ?? 'An error occurred')
          }
        }
        if (event.type === 'context_summary') {
          const payload = event.payload as { message?: string }
          if (payload.message) {
            setMessages((prev) => [...prev, { role: 'assistant', content: `_${payload.message}_` }])
          }
        }
      } catch {
        // ignore malformed events
      }
    }

    es.onerror = () => {
      clearTimeout(fallbackTimer)
      // On error, try DB fallback before giving up
      fetchTaskOutput(tid).then((found) => {
        if (!found) {
          setStatus((prev) => (prev === 'done' ? 'done' : 'error'))
        }
      })
      es.close()
    }
  }, [fetchTaskOutput, projectId])

  // Auto-reconnect: check for an existing running task on mount
  useEffect(() => {
    let cancelled = false
    async function checkActiveTask() {
      try {
        const params = new URLSearchParams()
        if (sprintId) params.set('sprintId', sprintId)
        if (personaName) params.set('personaName', personaName)
        const res = await fetch(`/api/projects/${projectId}/active-task?${params.toString()}`)
        if (!res.ok || cancelled) return
        const { taskId: tid, sessionId: sid } = await res.json()
        if (!cancelled && tid && sid) {
          connectToStream(tid, sid)
        }
      } catch {
        // No active task or network error — stay idle
      }
    }
    checkActiveTask()
    return () => { cancelled = true }
  }, [projectId, sprintId, personaName, connectToStream])

  /** Create an agent task and connect to its stream */
  const startTask = useCallback(async (userMessage?: string) => {
    setStatus('connecting')
    setError(null)

    try {
      // Build conversation history for the input
      const history = conversationHistoryRef.current.map((m) => ({
        role: m.role,
        content: m.content,
        timestamp: new Date().toISOString(),
      }))

      const taskInput = {
        ...input,
        stage,
        ...(userMessage ? { rawRequirements: userMessage, userMessage } : {}),
        ...(history.length > 0 ? { conversationHistory: history } : {}),
      }

      const taskRes = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName,
          sprintId,
          input: taskInput,
        }),
      })
      if (!taskRes.ok) {
        const err = await taskRes.json().catch(() => ({ error: 'Task creation failed' }))
        throw new Error(err.error ?? 'Task creation failed')
      }

      const { taskId: tid, sessionId } = await taskRes.json()
      connectToStream(tid, sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setStatus('error')
    }
  }, [projectId, sprintId, personaName, stage, input, connectToStream])

  /** Handle sending a message (initial or follow-up) */
  const handleSendMessage = useCallback(async () => {
    const text = userInput.trim()
    if (!text) return

    // Add user message to display
    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    conversationHistoryRef.current.push(userMsg)
    setUserInput('')
    setArtifact(null)

    await startTask(text)
  }, [userInput, startTask])

  /** Handle approve & continue */
  const handleApprove = useCallback(async () => {
    if (!onApprove) return
    setApproving(true)
    try {
      await onApprove(artifact, taskId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setApproving(false)
    }
  }, [onApprove, artifact, taskId])

  const handleStepBackConfirm = useCallback(async () => {
    if (!sprintId || !priorStage) return
    try {
      const res = await fetch(`/api/sprints/${sprintId}/step-back`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStage: priorStage }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Step back failed' }))
        throw new Error(err.error ?? 'Step back failed')
      }
      router.push(`/projects/${projectId}/sprints/${sprintId}/${priorStage}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Step back failed')
      setShowStepBack(false)
    }
  }, [sprintId, priorStage, projectId, router])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }, [handleSendMessage])

  const statusDot = {
    idle: 'bg-slate-500',
    connecting: 'bg-amber-400 animate-pulse',
    connected: 'bg-green-400',
    done: 'bg-green-400',
    error: 'bg-red-400',
  }[status]

  const showInput = status === 'idle' || status === 'done' || status === 'error'

  return (
    <>
      {/* Handoff card */}
      {showHandoff && previousPersona && (
        <HandoffCard
          from={previousPersona}
          to={personaName}
          onComplete={() => setShowHandoff(false)}
        />
      )}

      {/* Step back modal */}
      <StepBackModal
        isOpen={showStepBack}
        currentStage={currentStageLabel}
        priorStage={priorStageLabel}
        onConfirm={handleStepBackConfirm}
        onCancel={() => setShowStepBack(false)}
      />

      <div className="flex h-full">
        {/* Conversation Panel */}
        <div className="w-3/5 border-r border-slate-800 flex flex-col">
          <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusDot}`} />
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: colour }} />
            <span className="font-medium">{displayName}</span>
            <span className="ml-auto text-xs text-slate-500 capitalize">{stage}</span>
            {isSprintStage && priorStage && (
              <button
                onClick={() => setShowStepBack(true)}
                className="ml-2 px-2 py-1 text-xs border border-slate-700 text-slate-400 rounded hover:bg-slate-800 hover:text-slate-200 transition-colors"
              >
                Step Back
              </button>
            )}
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && status === 'idle' && (
              <p className="text-slate-400 text-sm">
                {inputPlaceholder
                  ? `${displayName} is ready. Type a message below to begin.`
                  : `${displayName} will help you with ${stage}. Type a message or click Start below.`}
              </p>
            )}
            {messages.map((msg, i) => (
              <PersonaMessage
                key={i}
                personaName={msg.role === 'user' ? undefined : personaName}
                content={msg.content}
                requiresApproval={pendingApproval && i === messages.length - 1 && msg.role === 'assistant'}
                taskId={taskId ?? undefined}
              />
            ))}
            {budgetWarning && (
              <div className="p-3 bg-amber-900/30 border border-amber-800/50 rounded-lg text-sm text-amber-400">
                {budgetWarning}
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-sm text-red-400">
                {error}
                <button
                  onClick={() => { setError(null); setStatus('idle') }}
                  className="ml-2 underline text-red-300 hover:text-red-200"
                >
                  Dismiss
                </button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="p-4 border-t border-slate-800 space-y-2">
            {showInput && (
              <div className="flex gap-2">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={inputPlaceholder ?? `Message ${displayName}...`}
                  rows={2}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none text-sm"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || status === 'connecting'}
                  className="px-4 py-2 text-white font-medium rounded-lg transition-colors disabled:opacity-50 self-end"
                  style={{ backgroundColor: colour }}
                >
                  Send
                </button>
              </div>
            )}

            {/* Start button (if no message input needed) */}
            {status === 'idle' && !inputPlaceholder && messages.length === 0 && (
              <button
                onClick={() => startTask()}
                className="w-full py-2 text-white font-semibold rounded-lg transition-colors"
                style={{ backgroundColor: colour }}
              >
                Start with {displayName}
              </button>
            )}

            {status === 'connecting' && (
              <div className="text-center text-sm text-slate-500">
                Connecting...
              </div>
            )}

            {/* Approve & Continue button */}
            {status === 'done' && onApprove && (
              <button
                onClick={handleApprove}
                disabled={approving}
                className="w-full py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {approving ? 'Approving...' : `Approve ${artifactTitle ?? currentStageLabel}`}
              </button>
            )}
          </div>
        </div>

        {/* Artifact Panel */}
        <div className="w-2/5 p-6 overflow-y-auto">
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
    </>
  )
}
