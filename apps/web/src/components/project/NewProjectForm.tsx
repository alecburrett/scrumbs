'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface FormData { name: string; githubRepo: string; description?: string }
interface Props { onSubmit: (data: FormData) => void }

export function NewProjectForm({ onSubmit }: Props) {
  const [name, setName] = useState('')
  const [githubRepo, setGithubRepo] = useState('')
  const [description, setDescription] = useState('')
  const [repoError, setRepoError] = useState('')

  function validateRepo(value: string) {
    if (value && !/^[\w.-]+\/[\w.-]+$/.test(value)) {
      setRepoError('Must be in owner/repo format')
    } else {
      setRepoError('')
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (repoError) return
    onSubmit({ name, githubRepo, description: description || undefined })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Project Name</Label>
        <Input
          id="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="My Project"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="githubRepo">GitHub Repository</Label>
        <Input
          id="githubRepo"
          value={githubRepo}
          onChange={e => { setGithubRepo(e.target.value); validateRepo(e.target.value) }}
          onBlur={e => validateRepo(e.target.value)}
          placeholder="owner/repo"
          required
        />
        {repoError && <p className="text-sm text-destructive">{repoError}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="What are you building?"
        />
      </div>
      <Button type="submit" className="w-full">Create Project</Button>
    </form>
  )
}
