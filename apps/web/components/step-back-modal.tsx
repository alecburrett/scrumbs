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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 max-w-md w-full mx-4 space-y-4">
        <h3 className="text-lg font-semibold text-white">Step Back?</h3>
        <p className="text-slate-400 text-sm">
          Going back from <strong className="text-white">{currentStage}</strong> to{' '}
          <strong className="text-white">{priorStage}</strong> will mark all artifacts from
          the current stage as superseded. This cannot be undone.
        </p>
        <p className="text-slate-500 text-xs">
          Git commits on the feature branch are preserved.
        </p>
        <div className="flex gap-3 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Step Back
          </button>
        </div>
      </div>
    </div>
  )
}
