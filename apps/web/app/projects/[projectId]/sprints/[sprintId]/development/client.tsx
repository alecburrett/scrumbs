'use client'

import { useCallback, useState } from 'react'
import type { StoryStatus } from '@scrumbs/types'
import { KanbanStrip } from '@/components/kanban-strip'
import { TerminalPanel } from '@/components/terminal-panel'

interface DevelopmentClientProps {
  projectId: string
  sprintId: string
  sprintNumber: number
  featureBranch?: string
  stories: Array<{
    id: string
    title: string
    description: string
    status: StoryStatus
  }>
}

export function DevelopmentClient({
  projectId,
  sprintId,
  sprintNumber,
  featureBranch,
  stories,
}: DevelopmentClientProps) {
  const [taskId, setTaskId] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [agentServiceUrl, setAgentServiceUrl] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStoryStatus = useCallback((storyId: string, status: string) => {
    // Update story status via API
    fetch(`/api/sprints/${sprintId}/stories/${storyId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).catch(() => {})
  }, [sprintId])

  const handleStart = useCallback(async () => {
    setStarting(true)
    setError(null)

    try {
      const configRes = await fetch('/api/config')
      if (!configRes.ok) throw new Error('Failed to load config')
      const config = await configRes.json()
      setAgentServiceUrl(config.agentServiceUrl)

      const taskRes = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaName: 'viktor',
          sprintId,
          input: {
            persona: 'viktor',
            stage: 'development',
            sprintId,
            sprintNumber,
            featureBranch: featureBranch ?? `sprint-${sprintNumber}`,
            stories: stories.map((s) => ({
              id: s.id,
              title: s.title,
              description: s.description,
              status: s.status,
            })),
          },
        }),
      })
      if (!taskRes.ok) {
        const err = await taskRes.json().catch(() => ({ error: 'Task creation failed' }))
        throw new Error(err.error ?? 'Task creation failed')
      }

      const result = await taskRes.json()
      setTaskId(result.taskId)
      setSessionId(result.sessionId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setStarting(false)
    }
  }, [projectId, sprintId, sprintNumber, featureBranch, stories])

  return (
    <div className="flex flex-col h-full p-4 gap-4">
      {/* Kanban strip */}
      <div className="h-48 border-b border-slate-800 pb-4">
        <h2 className="text-sm font-semibold text-slate-400 mb-3">
          Sprint {sprintNumber} Stories
        </h2>
        <KanbanStrip initialStories={stories} />
      </div>

      {/* Terminal panel or start button */}
      <div className="flex-1">
        {taskId && sessionId && agentServiceUrl ? (
          <TerminalPanel
            taskId={taskId}
            sessionId={sessionId}
            agentServiceUrl={agentServiceUrl}
            onStoryStatus={handleStoryStatus}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-slate-950 rounded-lg border border-slate-800 p-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-xs text-slate-400 font-mono">Viktor -- terminal</span>
            </div>
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-sm text-red-400">
                {error}
              </div>
            )}
            <p className="text-slate-600 font-mono text-sm mb-4">
              Ready to start development on {featureBranch ?? `sprint-${sprintNumber}`}
            </p>
            <button
              onClick={handleStart}
              disabled={starting}
              className="px-6 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
            >
              {starting ? 'Starting...' : 'Start Viktor'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
