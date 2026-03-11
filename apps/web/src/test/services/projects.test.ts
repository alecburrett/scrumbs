import { describe, it, expect, vi } from 'vitest'

vi.mock('@scrumbs/db', () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
}))

import { createProject, getProjectsByUser } from '@/lib/services/projects'

describe('project service', () => {
  it('rejects empty userId', async () => {
    await expect(createProject({ userId: '', name: 'X', githubRepo: 'a/b' }))
      .rejects.toThrow('userId is required')
  })

  it('rejects invalid githubRepo format', async () => {
    await expect(createProject({ userId: 'u1', name: 'X', githubRepo: 'notvalid' }))
      .rejects.toThrow('owner/repo format')
  })

  it('rejects empty name', async () => {
    await expect(createProject({ userId: 'u1', name: '', githubRepo: 'a/b' }))
      .rejects.toThrow('name is required')
  })
})
