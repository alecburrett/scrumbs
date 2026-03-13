'use client'

import { PERSONA_COLOURS, PERSONA_DISPLAY_NAMES } from '@/lib/persona-constants'
import type { PersonaName } from '@scrumbs/types'
import { ApproveButton } from './approve-button'

interface PersonaMessageProps {
  personaName: PersonaName
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
  const colour = PERSONA_COLOURS[personaName]
  const displayName = PERSONA_DISPLAY_NAMES[personaName]

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: colour }} />
        <span className="text-xs font-medium" style={{ color: colour }}>
          {displayName}
        </span>
      </div>
      <div className="ml-4 p-3 bg-slate-800 rounded-lg text-sm text-slate-200 whitespace-pre-wrap">
        {content}
      </div>
      {requiresApproval && taskId && (
        <div className="ml-4 mt-2">
          <ApproveButton taskId={taskId} />
        </div>
      )}
    </div>
  )
}
