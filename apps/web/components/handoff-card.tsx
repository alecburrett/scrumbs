'use client'

import { useEffect, useState } from 'react'
import { PERSONA_COLOURS, PERSONA_DISPLAY_NAMES } from '@/lib/persona-constants'
import type { PersonaName } from '@scrumbs/types'

interface HandoffCardProps {
  from: PersonaName
  to: PersonaName
  onComplete: () => void
}

export function HandoffCard({ from, to, onComplete }: HandoffCardProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      onComplete()
    }, 1500)
    return () => clearTimeout(timer)
  }, [onComplete])

  if (!visible) return null

  const fromName = PERSONA_DISPLAY_NAMES[from].toLowerCase()
  const toName = PERSONA_DISPLAY_NAMES[to].toLowerCase()

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 font-mono">
      <div className="bg-terminal-surface border border-terminal-border p-8 text-center space-y-4 min-w-[320px]">
        <div className="text-xs text-terminal-dim tracking-widest uppercase mb-6">handoff</div>
        <div className="flex items-center justify-center gap-6">
          <div className="text-center space-y-2">
            <div className="w-2 h-2 bg-terminal-muted mx-auto" />
            <span className="text-xs text-terminal-muted">{fromName}</span>
          </div>
          <span className="text-terminal-dim text-sm">──→</span>
          <div className="text-center space-y-2">
            <div className="w-2 h-2 bg-terminal-accent mx-auto animate-pulse" />
            <span className="text-xs text-terminal-accent">{toName}</span>
          </div>
        </div>
        <button
          onClick={() => { setVisible(false); onComplete() }}
          className="text-xs text-terminal-dim hover:text-terminal-muted transition-colors mt-4"
        >
          [skip]
        </button>
      </div>
    </div>
  )
}
