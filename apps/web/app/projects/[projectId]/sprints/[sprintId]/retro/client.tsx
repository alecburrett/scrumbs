'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { StageWorkspace } from '@/components/stage-workspace'

interface RetroClientProps {
  projectId: string
  sprintId: string
  sprintNumber: number
  sprintStatus: string
  stories: Array<{ title: string; status: string }>
}

export function RetroClient({
  projectId,
  sprintId,
  sprintNumber,
  sprintStatus,
  stories,
}: RetroClientProps) {
  const router = useRouter()
  const [retroDone, setRetroDone] = useState(false)
  const [retroArtifact, setRetroArtifact] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApprove = useCallback(async (artifact: string | null) => {
    setRetroArtifact(artifact)
    setRetroDone(true)
  }, [])

  const handleStartNextSprint = useCallback(async () => {
    setStarting(true)
    setError(null)
    try {
      const res = await fetch(`/api/sprints/${sprintId}/retro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          retroContent: retroArtifact,
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Failed to start next sprint')
      }
      const { sprintId: newSprintId } = await res.json()
      router.push(`/projects/${projectId}/sprints/${newSprintId}/planning`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setStarting(false)
    }
  }, [sprintId, retroArtifact, projectId, router])

  if (sprintStatus !== 'complete') {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-slate-500 text-sm">
          Sprint retro will be available once the sprint is complete.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 min-h-0">
        <StageWorkspace
          projectId={projectId}
          sprintId={sprintId}
          personaName="stella"
          stage="retro"
          input={{
            persona: 'stella',
            stage: 'retro',
            sprintId,
            sprintNumber,
            completedStories: stories,
          }}
          artifactTitle="Retrospective"
          onApprove={handleApprove}
          previousPersona="dex"
        />
      </div>
      {retroDone && (
        <div className="p-4 border-t border-slate-800 space-y-2">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-800/50 rounded-lg text-sm text-red-400">
              {error}
            </div>
          )}
          <button
            onClick={handleStartNextSprint}
            disabled={starting}
            className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {starting ? 'Creating...' : `Start Sprint ${sprintNumber + 1}`}
          </button>
        </div>
      )}
    </div>
  )
}
