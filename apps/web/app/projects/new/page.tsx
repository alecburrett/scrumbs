'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewProjectPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Parse GitHub repo URL: https://github.com/owner/repo or owner/repo
    const match = repoUrl.match(/(?:github\.com\/)?([^/]+)\/([^/\s]+?)(?:\.git)?$/)
    if (!match) {
      setError('Invalid GitHub repository URL. Use format: owner/repo')
      setLoading(false)
      return
    }

    const [, githubOwner, githubRepo] = match

    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, githubOwner, githubRepo }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Failed to create project')
      setLoading(false)
      return
    }

    const { id } = await res.json()
    router.push(`/projects/${id}`)
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-white items-center justify-center">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-8">
        <h1 className="text-2xl font-bold mb-6">New Project</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Project name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome App"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              GitHub repository
            </label>
            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="owner/repo or https://github.com/owner/repo"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Creating…' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  )
}
