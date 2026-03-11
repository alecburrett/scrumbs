'use client'
import { useRouter } from 'next/navigation'
import { NewProjectForm } from '@/components/project/NewProjectForm'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

export default function NewProjectPage() {
  const router = useRouter()

  async function handleSubmit(data: { name: string; githubRepo: string; description?: string }) {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      const project = await res.json()
      router.push(`/dashboard/projects/${project.id}`)
    }
  }

  return (
    <div className="p-8 max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>New Project</CardTitle>
          <CardDescription>Connect a GitHub repo to start your AI-assisted sprint</CardDescription>
        </CardHeader>
        <CardContent>
          <NewProjectForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  )
}
