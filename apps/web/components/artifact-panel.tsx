interface ArtifactPanelProps {
  title: string
  content?: string
  emptyMessage?: string
}

export function ArtifactPanel({
  title,
  content,
  emptyMessage = 'Content will appear here.',
}: ArtifactPanelProps) {
  return (
    <div className="h-full flex flex-col p-6">
      <h2 className="text-lg font-semibold mb-4 text-slate-300">{title}</h2>
      {content ? (
        <div className="flex-1 overflow-y-auto prose prose-invert prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-slate-200 text-sm font-mono bg-transparent p-0">
            {content}
          </pre>
        </div>
      ) : (
        <p className="text-slate-500 text-sm">{emptyMessage}</p>
      )}
    </div>
  )
}
