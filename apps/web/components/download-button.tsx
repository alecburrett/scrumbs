'use client'

interface DownloadButtonProps {
  filename: string
  content: string
}

export function DownloadButton({ filename, content }: DownloadButtonProps) {
  function handleDownload() {
    const blob = new Blob([content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleDownload}
      className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-mono text-terminal-muted hover:text-terminal-accent hover:bg-terminal-surface transition-colors group text-left"
    >
      <span className="truncate">{filename}</span>
      <span className="text-terminal-dim group-hover:text-terminal-accent ml-1 shrink-0">↓</span>
    </button>
  )
}
