import { describe, it, expect, vi } from 'vitest'

vi.mock('next-auth', () => ({
  default: vi.fn(() => ({
    handlers: { GET: vi.fn(), POST: vi.fn() },
    auth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  })),
}))
vi.mock('@auth/drizzle-adapter', () => ({ DrizzleAdapter: vi.fn(() => ({})) }))
vi.mock('@scrumbs/db', () => ({ db: {}, users: {}, accounts: {} }))

describe('auth config', () => {
  it('exports handlers, auth, signIn, signOut', async () => {
    const authModule = await import('@/auth')
    expect(typeof authModule.handlers).toBe('object')
    expect(typeof authModule.auth).toBe('function')
    expect(typeof authModule.signIn).toBe('function')
    expect(typeof authModule.signOut).toBe('function')
  })
})
