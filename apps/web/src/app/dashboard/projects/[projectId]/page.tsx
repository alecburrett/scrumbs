import { auth } from '@/auth'
import { redirect, notFound } from 'next/navigation'
import { getProjectById } from '@/lib/services/projects'
import { getSprintsByProject, createSprint } from '@/lib/services/sprints'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const { projectId } = await params
  const project = await getProjectById(projectId, session.user.id)
  if (!project) notFound()

  const sprints = await getSprintsByProject(projectId)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{project.name}</h2>
          <p className="text-muted-foreground">{project.githubRepo}</p>
        </div>
        <form action={async () => {
          'use server'
          const sprint = await createSprint({ projectId })
          redirect(`/dashboard/projects/${projectId}/sprints/${sprint.id}`)
        }}>
          <Button type="submit" className="gap-2">
            <Plus className="h-4 w-4" /> New Sprint
          </Button>
        </form>
      </div>

      {sprints.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-muted-foreground mb-4">No sprints yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sprints.map(s => (
            <Link key={s.id} href={`/dashboard/projects/${projectId}/sprints/${s.id}`}>
              <Card className="hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <div>
                    <CardTitle className="text-base">Sprint {s.number}</CardTitle>
                    {s.goal && <CardDescription>{s.goal}</CardDescription>}
                  </div>
                  <Badge variant="outline">{s.status}</Badge>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
