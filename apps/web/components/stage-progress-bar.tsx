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

const STAGES: { key: Stage; label: string }[] = [
  { key: 'requirements', label: 'req' },
  { key: 'prd',          label: 'prd' },
  { key: 'planning',     label: 'plan' },
  { key: 'development',  label: 'dev' },
  { key: 'review',       label: 'rev' },
  { key: 'qa',           label: 'qa' },
  { key: 'deploy',       label: 'deploy' },
  { key: 'retro',        label: 'retro' },
]

const STATUS_TO_STAGE: Record<string, Stage> = {
  requirements: 'requirements',
  prd:          'prd',
  planning:     'planning',
  development:  'development',
  review:       'review',
  qa:           'qa',
  deploying:    'deploy',
  deploy:       'deploy',
  complete:     'retro',
  retro:        'retro',
}

function stageHref(stage: Stage, projectId: string, sprintId?: string): string {
  switch (stage) {
    case 'requirements': return `/projects/${projectId}/requirements`
    case 'prd':          return `/projects/${projectId}/prd`
    case 'planning':     return sprintId ? `/projects/${projectId}/sprints/${sprintId}/planning` : '#'
    case 'development':  return sprintId ? `/projects/${projectId}/sprints/${sprintId}/development` : '#'
    case 'review':       return sprintId ? `/projects/${projectId}/sprints/${sprintId}/review` : '#'
    case 'qa':           return sprintId ? `/projects/${projectId}/sprints/${sprintId}/qa` : '#'
    case 'deploy':       return sprintId ? `/projects/${projectId}/sprints/${sprintId}/deploy` : '#'
    case 'retro':        return sprintId ? `/projects/${projectId}/sprints/${sprintId}/retro` : '#'
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
    <div className="flex items-center gap-0 font-mono text-xs">
      {STAGES.map((stage, i) => {
        const isDone    = currentIndex >= 0 && i < currentIndex
        const isCurrent = i === currentIndex

        const label = isDone ? `✓${stage.label}` : stage.label

        const cls = isCurrent
          ? 'px-2 py-0.5 text-terminal-accent border border-terminal-accent'
          : isDone
            ? 'px-2 py-0.5 text-terminal-muted hover:text-terminal-text transition-colors'
            : 'px-2 py-0.5 text-terminal-dim'

        const sep = i < STAGES.length - 1
          ? <span key={`sep-${i}`} className="text-terminal-dim">·</span>
          : null

        const content = isDone ? (
          <a key={stage.key} href={stageHref(stage.key, projectId, sprintId)} className={cls}>
            {label}
          </a>
        ) : (
          <span key={stage.key} className={cls}>{label}</span>
        )

        return [content, sep]
      })}
    </div>
  )
}
