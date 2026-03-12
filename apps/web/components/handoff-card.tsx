'use client'

import { useEffect, useState } from 'react'
import { PERSONA_COLOURS, PERSONA_DISPLAY_NAMES } from '@scrumbs/personas'
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

  return (
    <div className="fixed inset-0 bg-slate-950/80 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-8 text-center space-y-4 animate-fade-in">
        <div className="flex items-center justify-center gap-6">
          <div className="text-center">
            <span
              className="block w-12 h-12 rounded-full mx-auto mb-2"
              style={{ backgroundColor: PERSONA_COLOURS[from] }}
            />
            <span className="text-sm text-slate-400">{PERSONA_DISPLAY_NAMES[from]}</span>
          </div>
          <span className="text-2xl text-slate-500">→</span>
          <div className="text-center">
            <span
              className="block w-12 h-12 rounded-full mx-auto mb-2"
              style={{ backgroundColor: PERSONA_COLOURS[to] }}
            />
            <span className="text-sm text-slate-300 font-medium">{PERSONA_DISPLAY_NAMES[to]}</span>
          </div>
        </div>
        <button
          onClick={() => { setVisible(false); onComplete() }}
          className="text-xs text-slate-500 hover:text-slate-300"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
