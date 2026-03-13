'use client'

type Stage =
  | 'requirements'
  | 'prd'
  | 'planning'
  | 'development'
  | 'review-qa'
  | 'deploy'

const STAGES: { key: Stage; label: string }[] = [
  { key: 'requirements', label: 'Requirements' },
  { key: 'prd', label: 'PRD' },
  { key: 'planning', label: 'Planning' },
  { key: 'development', label: 'Development' },
  { key: 'review-qa', label: 'Review & QA' },
  { key: 'deploy', label: 'Deploy' },
]

interface StageProgressBarProps {
  currentStage?: Stage
}

export function StageProgressBar({ currentStage }: StageProgressBarProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === currentStage)

  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage, i) => {
        const isDone = i < currentIndex
        const isCurrent = i === currentIndex

        return (
          <div key={stage.key} className="flex items-center gap-1">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                isCurrent
                  ? 'bg-blue-600 text-white'
                  : isDone
                  ? 'bg-slate-700 text-slate-300'
                  : 'text-slate-600'
              }`}
            >
              {stage.label}
            </div>
            {i < STAGES.length - 1 && (
              <span className="text-slate-700 text-xs">›</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
