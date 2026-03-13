import type { SSEEvent, SSEEventType } from '@scrumbs/types'

interface TerminalEventProps {
  event: SSEEvent
}

export function TerminalEventRow({ event }: TerminalEventProps) {
  const payload = event.payload as Record<string, unknown>

  switch (event.type as SSEEventType) {
    case 'tool_call':
      return (
        <div className="flex gap-2">
          <span className="text-cyan-400 font-mono">[tool]</span>
          <span className="text-cyan-300 font-mono">{String(payload?.name ?? '')}</span>
          <span className="text-slate-500 font-mono text-xs truncate">
            {payload?.input ? JSON.stringify(payload.input) : ''}
          </span>
        </div>
      )

    case 'tool_output':
      return (
        <div className="text-slate-300 font-mono text-xs whitespace-pre-wrap">
          {String(payload?.output ?? payload)}
        </div>
      )

    case 'file_write':
      return (
        <div className="flex gap-2">
          <span className="text-green-400 font-mono">[write]</span>
          <span className="text-green-300 font-mono">{String(payload?.path ?? '')}</span>
        </div>
      )

    case 'test_pass':
      return (
        <div className="flex gap-2">
          <span className="text-green-400 font-mono">✓</span>
          <span className="text-green-300 font-mono text-sm">{String(payload?.test ?? '')}</span>
        </div>
      )

    case 'test_fail':
      return (
        <div className="flex gap-2">
          <span className="text-red-400 font-mono">✗</span>
          <span className="text-red-300 font-mono text-sm">{String(payload?.test ?? '')}</span>
        </div>
      )

    case 'git_op':
      return (
        <div className="flex gap-2">
          <span className="text-blue-400 font-mono">[git]</span>
          <span className="text-blue-300 font-mono text-sm">{String(payload?.message ?? payload)}</span>
        </div>
      )

    case 'error':
      if (payload?.warning) {
        return (
          <div className="text-amber-400 font-mono text-sm">
            [warning] {String(payload?.message ?? payload)}
          </div>
        )
      }
      return (
        <div className="text-red-400 font-mono text-sm">
          [error] {String(payload?.message ?? payload)}
        </div>
      )

    case 'context_summary':
      return (
        <div className="text-slate-600 font-mono text-xs italic">
          Context summarised at ~{String(payload?.tokens ?? '?')}k tokens
        </div>
      )

    case 'retry':
      return (
        <div className="text-slate-600 font-mono text-xs italic">
          Retrying API call (attempt {String(payload?.attempt ?? '?')}/3)…
        </div>
      )

    case 'done':
      return (
        <div className="text-slate-500 font-mono text-xs">
          — task complete —
        </div>
      )

    case 'message':
      return (
        <div className="text-slate-200 font-mono text-sm whitespace-pre-wrap">
          {String(payload?.message ?? payload ?? '')}
        </div>
      )

    default:
      return null
  }
}
