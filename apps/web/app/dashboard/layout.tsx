import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { ProjectList } from '@/components/sidebar/project-list'
import { NewProjectCta } from '@/components/sidebar/new-project-cta'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect('/')

  return (
    <div className="flex min-h-screen bg-terminal-bg text-terminal-text">
      {/* Sidebar */}
      <aside className="w-48 border-r border-terminal-border flex flex-col shrink-0">
        <div className="px-4 py-3 border-b border-terminal-border">
          <span className="text-xs tracking-widest uppercase text-terminal-accent font-mono font-bold">
            scrumbs
          </span>
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          <div className="px-4 mb-2">
            <span className="terminal-label">projects</span>
          </div>
          <ProjectList />
        </nav>
        <div className="p-3 border-t border-terminal-border">
          <NewProjectCta />
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-hidden flex flex-col">{children}</main>
    </div>
  )
}
