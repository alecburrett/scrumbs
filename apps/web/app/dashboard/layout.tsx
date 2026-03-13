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
    <div className="flex min-h-screen bg-slate-950 text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <span className="text-lg font-bold">Scrumbs</span>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <ProjectList />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <NewProjectCta />
        </div>
      </aside>
      {/* Main */}
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
