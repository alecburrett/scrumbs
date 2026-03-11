import { describe, it, expect, vi } from 'vitest'

vi.mock('@scrumbs/db', () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
  sprints: { projectId: 'project_id', number: 'number' },
}))
vi.mock('drizzle-orm', () => ({ eq: vi.fn(), desc: vi.fn() }))

import { createSprint, getNextSprintNumber } from '@/lib/services/sprints'

describe('sprint service', () => {
  it('rejects empty projectId', async () => {
    await expect(createSprint({ projectId: '' })).rejects.toThrow('projectId is required')
  })

  it('getNextSprintNumber returns 1 when no sprints exist', async () => {
    const { db } = await import('@scrumbs/db')
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    } as any)
    expect(await getNextSprintNumber('proj-1')).toBe(1)
  })

  it('getNextSprintNumber increments from last sprint', async () => {
    const { db } = await import('@scrumbs/db')
    vi.mocked(db.select).mockReturnValue({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([{ number: 3 }]),
    } as any)
    expect(await getNextSprintNumber('proj-1')).toBe(4)
  })
})
