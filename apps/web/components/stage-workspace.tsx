'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PERSONA_DISPLAY_NAMES } from '@/lib/persona-constants'
import type { PersonaName, SSEEvent } from '@scrumbs/types'
import { PersonaMessage } from '@/components/persona-message'
import { HandoffCard } from '@/components/handoff-card'
import { StepBackModal } from '@/components/step-back-modal'
import { AgentStatusBar } from '@/components/typing-indicator'

const SPRINT_STAGES = ['planning', 'development', 'review', 'qa', 'deploy', 'retro'] as const

const STAGE_ORDER: Record<string, number> = {
  planning: 0, development: 1, review: 2, qa: 3, deploy: 4, retro: 5,
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
  inputPlaceholder?: string
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
  const conversationHistoryRef = useRef<ChatMessage[]>([])
  const esRef = useRef<EventSource | null>(null)

  const name = PERSONA_DISPLAY_NAMES[personaName].toLowerCase()
  const isSprintStage = STAGE_ORDER[stage] !== undefined
  const priorStage = getPriorStage(stage)
  const priorStageLabel = priorStage ? priorStage.charAt(0).toUpperCase() + priorStage.slice(1) : ''
  const currentStageLabel = stage.charAt(0).toUpperCase() + stage.slice(1)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    return () => { esRef.current?.close() }
  }, [])

  const fetchTaskOutput = useCallback(async (tid: string) => {
    try {
      const params = new URLSearchParams()
      if (sprintId) params.set('sprintId', sprintId)
      if (personaName) params.set('personaName', personaName)
      const res = await fetch(`/api/projects/${projectId}/active-task?${params.toString()}`)
      if (res.status === 404) {
        const taskRes = await fetch(`/api/projects/${projectId}/tasks/${tid}`)
        if (taskRes.ok) {
          const task = await taskRes.json()
          if (task.status === 'completed' && task.outputText) {
            setMessages((prev) => {
              if (prev.some((m) => m.role === 'assistant')) return prev
              return [...prev, { role: 'assistant', content: task.outputText }]
            })
            if (task.outputText.length > 200) setArtifact(task.outputText)
            setStatus('done')
            return true
          }
        }
      }
    } catch {
      // ignore — SSE is primary
    }
    return false
  }, [projectId, sprintId, personaName])

  const connectToStream = useCallback((tid: string, sid: string) => {
    esRef.current?.close()
    esRef.current = null

    setTaskId(tid)
    setStatus('connecting')
    let receivedEvents = false

    const url = `/api/projects/${projectId}/tasks/${tid}/stream?sessionId=${sid}`
    const es = new EventSource(url)
    esRef.current = es

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
            const msg: ChatMessage = {
              role: (payload.role as 'user' | 'assistant') ?? 'assistant',
              content: payload.content,
            }
            setMessages((prev) => [...prev, msg])
            if (msg.role === 'assistant') conversationHistoryRef.current.push(msg)
            if (payload.role !== 'user' && payload.content.length > 200) setArtifact(payload.content)
          }
        }
        if (event.type === 'approval_required') setPendingApproval(true)
        if (event.type === 'done') {
          clearTimeout(fallbackTimer)
          setStatus('done')
          es.close()
        }
        if (event.type === 'error') {
          const payload = event.payload as { warning?: boolean; message?: string }
          if (payload.warning) setBudgetWarning(payload.message ?? 'Token budget warning')
          else setError(payload.message ?? 'An error occurred')
        }
        if (event.type === 'context_summary') {
          const payload = event.payload as { message?: string }
          if (payload.message) {
            setMessages((prev) => [...prev, { role: 'assistant', content: `[context summarised: ${payload.message}]` }])
          }
        }
      } catch {
        // ignore malformed events
      }
    }

    es.onerror = () => {
      clearTimeout(fallbackTimer)
      fetchTaskOutput(tid).then((found) => {
        if (!found) setStatus((prev) => (prev === 'done' ? 'done' : 'error'))
      })
      es.close()
    }
  }, [fetchTaskOutput, projectId])

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
        if (!cancelled && tid && sid) connectToStream(tid, sid)
      } catch {
        // no active task
      }
    }
    checkActiveTask()
    return () => { cancelled = true }
  }, [projectId, sprintId, personaName, connectToStream])

  const startTask = useCallback(async (userMessage?: string) => {
    setStatus('connecting')
    setError(null)
    try {
      const history = conversationHistoryRef.current.map((m) => ({
        role: m.role, content: m.content, timestamp: new Date().toISOString(),
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
        body: JSON.stringify({ personaName, sprintId, input: taskInput }),
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

  const handleSendMessage = useCallback(async () => {
    const text = userInput.trim()
    if (!text) return
    const userMsg: ChatMessage = { role: 'user', content: text }
    setMessages((prev) => [...prev, userMsg])
    conversationHistoryRef.current.push(userMsg)
    setUserInput('')
    setArtifact(null)
    await startTask(text)
  }, [userInput, startTask])

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

  const showInput = status === 'idle' || status === 'done' || status === 'error'
  const isWorking = status === 'connecting' || status === 'connected'

  return (
    <>
      {showHandoff && previousPersona && (
        <HandoffCard from={previousPersona} to={personaName} onComplete={() => setShowHandoff(false)} />
      )}
      <StepBackModal
        isOpen={showStepBack}
        currentStage={currentStageLabel}
        priorStage={priorStageLabel}
        onConfirm={handleStepBackConfirm}
        onCancel={() => setShowStepBack(false)}
      />

      <div className="flex h-full bg-terminal-bg">
        {/* Conversation panel */}
        <div className="flex flex-col flex-1 overflow-hidden border-r border-terminal-border">
          {/* Panel header */}
          <div className="flex items-center gap-3 px-4 py-2 border-b border-terminal-border bg-terminal-surface shrink-0">
            <span className="text-xs font-mono text-terminal-accent">{name}@{stage}</span>
            {isSprintStage && priorStage && (
              <button
                onClick={() => setShowStepBack(true)}
                className="ml-auto text-xs font-mono text-terminal-dim hover:text-terminal-muted transition-colors border border-terminal-border px-2 py-0.5"
              >
                ← step back
              </button>
            )}
          </div>

          {/* Agent status bar */}
          {isWorking && <AgentStatusBar personaName={personaName} status={status} />}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && status === 'idle' && (
              <p className="text-xs font-mono text-terminal-dim">
                {inputPlaceholder
                  ? `{${name}} ready — type to begin`
                  : `{${name}} ready — click start or type a message`}
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
              <div className="text-xs font-mono text-terminal-warn border-l-2 border-terminal-warn pl-3">
                warn: {budgetWarning}
              </div>
            )}
            {error && (
              <div className="text-xs font-mono text-terminal-error border-l-2 border-terminal-error pl-3">
                error: {error}{' '}
                <button
                  onClick={() => { setError(null); setStatus('idle') }}
                  className="underline hover:text-terminal-text"
                >
                  [dismiss]
                </button>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-terminal-border p-3 space-y-2 bg-terminal-surface shrink-0">
            {showInput && (
              <div className="flex gap-2 items-end">
                <span className="text-terminal-accent text-xs font-mono mb-2">$</span>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={inputPlaceholder ?? `message ${name}...`}
                  rows={2}
                  className="flex-1 terminal-input resize-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!userInput.trim() || isWorking}
                  className="terminal-btn disabled:opacity-30 disabled:cursor-not-allowed self-end"
                >
                  send
                </button>
              </div>
            )}

            {status === 'idle' && !inputPlaceholder && messages.length === 0 && (
              <button
                onClick={() => startTask()}
                className="terminal-btn w-full"
              >
                start {name} →
              </button>
            )}

            {isWorking && (
              <div className="text-xs font-mono text-terminal-dim">
                <span className="animate-blink text-terminal-accent">_</span>
                {' '}processing...
              </div>
            )}

            {status === 'done' && onApprove && (
              <button
                onClick={handleApprove}
                disabled={approving}
                className="terminal-btn w-full disabled:opacity-30"
              >
                {approving ? 'approving...' : `approve ${artifactTitle?.toLowerCase() ?? stage} →`}
              </button>
            )}
          </div>
        </div>

        {/* Artifact panel */}
        <div className="w-2/5 flex flex-col overflow-hidden">
          <div className="px-4 py-2 border-b border-terminal-border bg-terminal-surface shrink-0">
            <span className="terminal-label">{artifactTitle?.toLowerCase() ?? stage}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {artifact ? (
              <pre className="text-xs font-mono text-terminal-text whitespace-pre-wrap leading-relaxed">{artifact}</pre>
            ) : (
              <p className="text-xs font-mono text-terminal-dim">
                {isWorking ? `{${name}} is writing...` : 'output will appear here'}
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
