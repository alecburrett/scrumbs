import type { SprintStatus } from '@scrumbs/types'

const VALID_TRANSITIONS: Record<SprintStatus, SprintStatus[]> = {
  planning:    ['development'],
  development: ['review'],
  review:      ['development', 'qa'],
  qa:          ['development', 'deploying'],
  deploying:   ['complete', 'qa'],
  complete:    [],
}

const PRIOR_STAGE: Partial<Record<SprintStatus, SprintStatus>> = {
  development: 'planning',
  review:      'development',
  qa:          'review',
  deploying:   'qa',
  complete:    'deploying',
}

export class TransitionError extends Error {
  constructor(
    public readonly from: SprintStatus,
    public readonly to: SprintStatus,
    public readonly trigger: string
  ) {
    super(`Invalid sprint transition: ${from} → ${to} (trigger: ${trigger})`)
    this.name = 'TransitionError'
  }
}

export function assertValidTransition(
  from: SprintStatus,
  to: SprintStatus,
  trigger: string
): void {
  if (!VALID_TRANSITIONS[from]?.includes(to)) {
    throw new TransitionError(from, to, trigger)
  }
}

export function getPriorStage(status: SprintStatus): SprintStatus | undefined {
  return PRIOR_STAGE[status]
}

export { VALID_TRANSITIONS, PRIOR_STAGE }
