'use client'

type ConnectionStatus = 'connected' | 'reconnecting' | 'disconnected'

interface ConnectionIndicatorProps {
  status: ConnectionStatus
}

export function ConnectionIndicator({ status }: ConnectionIndicatorProps) {
  const config = {
    connected: {
      colour: 'bg-green-400',
      label: 'Connected',
    },
    reconnecting: {
      colour: 'bg-amber-400 animate-pulse',
      label: 'Reconnecting…',
    },
    disconnected: {
      colour: 'bg-red-500',
      label: 'Disconnected',
    },
  }[status]

  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <span className={`w-2 h-2 rounded-full ${config.colour}`} />
      <span>{config.label}</span>
    </div>
  )
}
