'use client'

import { useState } from 'react'

interface ApprovalGateBannerProps {
  taskId: string
  onResolved: () => void
}

export function ApprovalGateBanner({ taskId, onResolved }: ApprovalGateBannerProps) {
  const [loading, setLoading] = useState(false)

  async function handleApprove() {
    setLoading(true)
    await fetch(`/api/tasks/${taskId}/approve`, { method: 'POST' })
    onResolved()
    setLoading(false)
  }

  async function handleReject() {
    setLoading(true)
    await fetch(`/api/tasks/${taskId}/cancel`, { method: 'POST' })
    onResolved()
    setLoading(false)
  }

  return (
    <div className="bg-amber-900/40 border-b border-amber-500/50 px-4 py-3 flex items-center justify-between">
      <span className="text-amber-200 text-sm font-medium">
        ⚠ Viktor is requesting approval to proceed
      </span>
      <div className="flex gap-2">
        <button
          onClick={handleReject}
          disabled={loading}
          className="px-3 py-1 text-sm border border-amber-600 text-amber-300 rounded hover:bg-amber-900/50 disabled:opacity-50"
        >
          Reject
        </button>
        <button
          onClick={handleApprove}
          disabled={loading}
          className="px-3 py-1 text-sm bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50"
        >
          Approve
        </button>
      </div>
    </div>
  )
}
