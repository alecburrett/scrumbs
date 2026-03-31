'use client'

import { PERSONA_DISPLAY_NAMES } from '@/lib/persona-constants'
import type { PersonaName } from '@scrumbs/types'

interface TypingIndicatorProps {
  personaName: PersonaName
}

export function TypingIndicator({ personaName }: TypingIndicatorProps) {
  const name = PERSONA_DISPLAY_NAMES[personaName].toLowerCase()

  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <span className="text-xs font-mono text-terminal-muted">{name}</span>
      <span className="text-terminal-muted text-xs font-mono">is working</span>
      <span className="flex gap-0.5 items-center">
        <span
          className="w-1 h-1 bg-terminal-accent rounded-none animate-pulse-accent"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-1 h-1 bg-terminal-accent rounded-none animate-pulse-accent"
          style={{ animationDelay: '300ms' }}
        />
        <span
          className="w-1 h-1 bg-terminal-accent rounded-none animate-pulse-accent"
          style={{ animationDelay: '600ms' }}
        />
      </span>
    </div>
  )
}

/** Top-of-workspace banner shown while an agent task is running */
export function AgentStatusBar({
  personaName,
  status,
}: {
  personaName: PersonaName
  status: 'connecting' | 'connected'
}) {
  const name = PERSONA_DISPLAY_NAMES[personaName].toLowerCase()
  const label = status === 'connecting' ? 'connecting' : 'working'

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 border-b border-terminal-border bg-terminal-surface text-xs font-mono">
      <span className="w-1.5 h-1.5 bg-terminal-accent animate-pulse rounded-none" />
      <span className="text-terminal-muted">
        {name}@scrumbs <span className="text-terminal-accent">{label}</span>
      </span>
      <span className="ml-auto text-terminal-dim animate-blink">_</span>
    </div>
  )
}
