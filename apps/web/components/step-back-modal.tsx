'use client'

interface StepBackModalProps {
  isOpen: boolean
  currentStage: string
  priorStage: string
  onConfirm: () => void
  onCancel: () => void
}

export function StepBackModal({
  isOpen,
  currentStage,
  priorStage,
  onConfirm,
  onCancel,
}: StepBackModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 font-mono">
      <div className="bg-terminal-surface border border-terminal-border p-6 max-w-md w-full mx-4 space-y-4">
        <div className="text-xs text-terminal-warn tracking-widest uppercase">! step back</div>
        <p className="text-terminal-muted text-xs leading-relaxed">
          going back from{' '}
          <span className="text-terminal-text">{currentStage.toLowerCase()}</span> to{' '}
          <span className="text-terminal-text">{priorStage.toLowerCase()}</span>{' '}
          will mark all artifacts from the current stage as superseded. this cannot be undone.
        </p>
        <p className="text-terminal-dim text-xs">
          git commits on the feature branch are preserved.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-1.5 border border-terminal-border text-terminal-muted hover:border-terminal-muted hover:text-terminal-text transition-colors text-xs"
          >
            cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-1.5 border border-terminal-error text-terminal-error hover:bg-terminal-error hover:text-black transition-colors text-xs"
          >
            step back →
          </button>
        </div>
      </div>
    </div>
  )
}
