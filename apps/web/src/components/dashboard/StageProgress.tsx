import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

type Stage = 'planning' | 'setup' | 'development' | 'review' | 'qa' | 'deploy' | 'retro'

const LABELS: Record<Stage, string> = {
  planning: 'Planning', setup: 'Setup', development: 'Development',
  review: 'Review', qa: 'QA', deploy: 'Deploy', retro: 'Retro',
}
const OWNERS: Record<Stage, string> = {
  planning: 'Stella', setup: 'Max', development: 'Viktor',
  review: 'Rex', qa: 'Quinn', deploy: 'Dex', retro: 'Stella',
}
const ALL: Stage[] = ['planning', 'setup', 'development', 'review', 'qa', 'deploy', 'retro']

export function StageProgress({ currentStage, completedStages }: { currentStage: Stage; completedStages: Stage[] }) {
  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b overflow-x-auto">
      {ALL.map((stage, i) => {
        const done = completedStages.includes(stage)
        const current = stage === currentStage
        return (
          <div key={stage} className="flex items-center gap-1 shrink-0">
            <div
              data-testid={`stage-${stage}`}
              className={cn(
                'flex flex-col items-center px-3 py-1.5 rounded-md text-xs transition-colors',
                done && 'completed bg-primary/10 text-primary',
                current && 'current bg-primary text-primary-foreground font-medium',
                !done && !current && 'text-muted-foreground opacity-50',
              )}
            >
              <div className="flex items-center gap-1">
                {done && <Check className="h-3 w-3" />}
                <span>{LABELS[stage]}</span>
              </div>
              <span className="text-[10px] opacity-70">{OWNERS[stage]}</span>
            </div>
            {i < ALL.length - 1 && <div className={cn('w-4 h-px', done ? 'bg-primary/40' : 'bg-border')} />}
          </div>
        )
      })}
    </div>
  )
}
