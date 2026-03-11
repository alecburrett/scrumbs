import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Project { id: string; name: string; githubRepo: string; status: string }
interface SidebarProps { projects: Project[]; currentProjectId: string | null }

export function Sidebar({ projects, currentProjectId }: SidebarProps) {
  const active = projects.filter(p => p.status === 'active')
  return (
    <aside className="w-64 border-r bg-muted/30 flex flex-col h-full">
      <div className="p-4 border-b">
        <h1 className="font-bold text-xl tracking-tight">Scrumbs</h1>
        <p className="text-xs text-muted-foreground mt-0.5">Your AI scrum team</p>
      </div>
      <ScrollArea className="flex-1 p-2">
        {active.map(p => (
          <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
            <div className={cn(
              'px-3 py-2 rounded-md text-sm cursor-pointer transition-colors hover:bg-accent',
              currentProjectId === p.id && 'bg-accent font-medium'
            )}>
              <div className="font-medium truncate">{p.name}</div>
              <div className="text-xs text-muted-foreground truncate">{p.githubRepo}</div>
            </div>
          </Link>
        ))}
      </ScrollArea>
      <div className="p-3 border-t">
        <Link href="/dashboard/projects/new">
          <Button variant="outline" size="sm" className="w-full gap-2">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </Link>
      </div>
    </aside>
  )
}
