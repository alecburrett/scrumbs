'use client'

type Stage =
  | 'requirements'
  | 'prd'
  | 'planning'
  | 'development'
  | 'review'
  | 'qa'
  | 'deploy'
  | 'retro'

const STAGES: { key: Stage; label: string; group: 'project' | 'sprint' }[] = [
  { key: 'requirements', label: 'Requirements', group: 'project' },
  { key: 'prd', label: 'PRD', group: 'project' },
  { key: 'planning', label: 'Planning', group: 'sprint' },
  { key: 'development', label: 'Development', group: 'sprint' },
  { key: 'review', label: 'Review', group: 'sprint' },
  { key: 'qa', label: 'QA', group: 'sprint' },
  { key: 'deploy', label: 'Deploy', group: 'sprint' },
  { key: 'retro', label: 'Retro', group: 'sprint' },
]

/** Map sprint status values to stage keys */
const STATUS_TO_STAGE: Record<string, Stage> = {
  requirements: 'requirements',
  prd: 'prd',
  planning: 'planning',
  development: 'development',
  review: 'review',
  qa: 'qa',
  deploying: 'deploy',
  deploy: 'deploy',
  complete: 'retro',
  retro: 'retro',
}

function stageHref(stage: Stage, projectId: string, sprintId?: string): string {
  switch (stage) {
    case 'requirements':
      return `/projects/${projectId}/requirements`
    case 'prd':
      return `/projects/${projectId}/prd`
    case 'planning':
      return sprintId ? `/projects/${projectId}/sprints/${sprintId}/planning` : '#'
    case 'development':
      return sprintId ? `/projects/${projectId}/sprints/${sprintId}/development` : '#'
    case 'review':
      return sprintId ? `/projects/${projectId}/sprints/${sprintId}/review` : '#'
    case 'qa':
      return sprintId ? `/projects/${projectId}/sprints/${sprintId}/qa` : '#'
    case 'deploy':
      return sprintId ? `/projects/${projectId}/sprints/${sprintId}/deploy` : '#'
    case 'retro':
      return sprintId ? `/projects/${projectId}/sprints/${sprintId}/retro` : '#'
  }
}

interface StageProgressBarProps {
  currentStage?: string
  projectId: string
  sprintId?: string
}

export function StageProgressBar({ currentStage, projectId, sprintId }: StageProgressBarProps) {
  const resolved = currentStage ? (STATUS_TO_STAGE[currentStage] ?? currentStage) : undefined
  const currentIndex = STAGES.findIndex((s) => s.key === resolved)

  return (
    <div className="flex items-center gap-1">
      {STAGES.map((stage, i) => {
        const isDone = currentIndex >= 0 && i < currentIndex
        const isCurrent = i === currentIndex
        const isFuture = currentIndex >= 0 ? i > currentIndex : true

        const baseClasses =
          'flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors'

        let className: string
        if (isCurrent) {
          className = `${baseClasses} bg-blue-600 text-white`
        } else if (isDone) {
          className = `${baseClasses} bg-slate-700 text-slate-300 hover:bg-slate-600`
        } else {
          className = `${baseClasses} text-slate-600`
        }

        const prevLabel = i > 0 ? STAGES[i - 1].label : ''
        const tooltip = isFuture ? `Complete ${prevLabel} before ${stage.label}` : undefined

        const content = (
          <>
            {isDone && (
              <svg className="w-3 h-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
            {stage.label}
          </>
        )

        return (
          <div key={stage.key} className="flex items-center gap-1">
            {isDone ? (
              <a
                href={stageHref(stage.key, projectId, sprintId)}
                className={className}
              >
                {content}
              </a>
            ) : (
              <span className={className} title={tooltip}>
                {content}
              </span>
            )}
            {i < STAGES.length - 1 && (
              <span className="text-slate-700 text-xs">&rsaquo;</span>
            )}
          </div>
        )
      })}
    </div>
  )
}
