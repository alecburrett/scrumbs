import { describe, it, expect } from 'vitest'
import { getTableConfig } from 'drizzle-orm/pg-core'
import { users, accounts, sessions, verificationTokens, authenticators } from '../auth.js'

describe('auth schema', () => {
  it('users table has unique email constraint', () => {
    const config = getTableConfig(users)
    const emailCol = config.columns.find(c => c.name === 'email')
    expect(emailCol?.isUnique).toBe(true)
  })

  it('authenticators table exists with correct PK and unique credential', () => {
    const config = getTableConfig(authenticators)
    expect(config.name).toBe('authenticator')
    const credIdCol = config.columns.find(c => c.name === 'credential_id')
    expect(credIdCol).toBeDefined()
    expect(credIdCol?.isUnique).toBe(true)
    // Verify composite PK on (userId, credentialID)
    expect(config.primaryKeys.length).toBeGreaterThan(0)
    const pkColNames = config.primaryKeys[0].columns.map(c => c.name)
    expect(pkColNames).toContain('userId')
    expect(pkColNames).toContain('credential_id')
  })
})
