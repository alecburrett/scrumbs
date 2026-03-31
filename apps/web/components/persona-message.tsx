'use client'

import { PERSONA_DISPLAY_NAMES } from '@/lib/persona-constants'
import type { PersonaName } from '@scrumbs/types'
import { ApproveButton } from './approve-button'

interface PersonaMessageProps {
  personaName?: PersonaName
  content: string
  requiresApproval?: boolean
  taskId?: string
}

export function PersonaMessage({
  personaName,
  content,
  requiresApproval,
  taskId,
}: PersonaMessageProps) {
  if (!personaName) {
    return (
      <div className="space-y-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-terminal-dim">you</span>
          <span className="text-terminal-dim text-xs">$</span>
        </div>
        <div className="ml-0 pl-3 border-l border-terminal-dim">
          <pre className="text-xs font-mono text-terminal-text whitespace-pre-wrap leading-relaxed">{content}</pre>
        </div>
      </div>
    )
  }

  const name = PERSONA_DISPLAY_NAMES[personaName].toLowerCase()

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-2">
        <span className="text-xs font-mono text-terminal-accent">{name}</span>
        <span className="text-terminal-dim text-xs">&gt;</span>
      </div>
      <div className="ml-0 pl-3 border-l border-terminal-accent/30">
        <pre className="text-xs font-mono text-terminal-text whitespace-pre-wrap leading-relaxed">{content}</pre>
      </div>
      {requiresApproval && taskId && (
        <div className="pl-3 mt-2">
          <ApproveButton taskId={taskId} />
        </div>
      )}
    </div>
  )
}
