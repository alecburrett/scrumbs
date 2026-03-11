import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { getProjectsByUser } from '@/lib/services/projects'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus } from 'lucide-react'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const projects = await getProjectsByUser(session.user.id)
  const active = projects.filter(p => p.status === 'active')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Projects</h2>
          <p className="text-muted-foreground">Your active sprints and projects</p>
        </div>
        <Link href="/dashboard/projects/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> New Project
          </Button>
        </Link>
      </div>

      {active.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-muted-foreground mb-4">No projects yet. Create one to get started.</p>
          <Link href="/dashboard/projects/new">
            <Button>Create your first project</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {active.map(p => (
            <Link key={p.id} href={`/dashboard/projects/${p.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle>{p.name}</CardTitle>
                  <CardDescription>{p.githubRepo}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
