'use client'

import { useState } from 'react'

interface ApproveButtonProps {
  taskId: string
}

export function ApproveButton({ taskId }: ApproveButtonProps) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleApprove() {
    setLoading(true)
    await fetch(`/api/tasks/${taskId}/approve`, { method: 'POST' })
    setDone(true)
    setLoading(false)
  }

  if (done) {
    return <span className="text-xs text-green-400">Approved ✓</span>
  }

  return (
    <button
      onClick={handleApprove}
      disabled={loading}
      className="px-4 py-1.5 bg-amber-500 text-white text-sm font-medium rounded-md hover:bg-amber-600 disabled:opacity-50 transition-colors"
    >
      {loading ? 'Approving…' : 'Approve'}
    </button>
  )
}
