import { auth } from '@/auth'
import { db } from '@/lib/db'
import { artifacts } from '@scrumbs/db'
import { eq, and, desc } from 'drizzle-orm'
import { DownloadButton } from './download-button'

interface FilesPanelProps {
  projectId: string
}

const TYPE_LABEL: Record<string, string> = {
  requirements: 'requirements.md',
  prd:          'prd.md',
  retro:        'retro.md',
  planning:     'planning.md',
}

export async function FilesPanel({ projectId }: FilesPanelProps) {
  const session = await auth()
  if (!session?.user?.id) return null

  const current = await db
    .select({
      id: artifacts.id,
      type: artifacts.type,
      contentMd: artifacts.contentMd,
      createdAt: artifacts.createdAt,
    })
    .from(artifacts)
    .where(and(eq(artifacts.projectId, projectId), eq(artifacts.status, 'current')))
    .orderBy(desc(artifacts.createdAt))

  return (
    <aside className="w-44 border-l border-terminal-border flex flex-col shrink-0 bg-terminal-bg">
      <div className="px-3 py-2 border-b border-terminal-border">
        <span className="terminal-label">/files</span>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {current.length === 0 ? (
          <p className="px-3 py-2 text-xs font-mono text-terminal-dim">no files yet</p>
        ) : (
          <ul className="space-y-0.5">
            {current.map((artifact) => (
              <li key={artifact.id}>
                <DownloadButton
                  filename={TYPE_LABEL[artifact.type] ?? `${artifact.type}.md`}
                  content={artifact.contentMd}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
