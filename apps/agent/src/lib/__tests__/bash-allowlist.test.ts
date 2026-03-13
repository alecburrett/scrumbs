import { describe, it, expect } from 'vitest'

const ALLOWED_COMMANDS = new Set([
  'npm', 'npx', 'node', 'git', 'tsc', 'vitest',
  'cat', 'ls', 'find', 'mkdir', 'cp', 'mv', 'rm',
  'echo', 'head', 'tail', 'grep', 'wc', 'diff', 'sort', 'uniq',
])

describe('bash allowlist', () => {
  it('allows npm', () => expect(ALLOWED_COMMANDS.has('npm')).toBe(true))
  it('allows git', () => expect(ALLOWED_COMMANDS.has('git')).toBe(true))
  it('allows vitest', () => expect(ALLOWED_COMMANDS.has('vitest')).toBe(true))
  it('blocks curl', () => expect(ALLOWED_COMMANDS.has('curl')).toBe(false))
  it('blocks wget', () => expect(ALLOWED_COMMANDS.has('wget')).toBe(false))
  it('blocks python3', () => expect(ALLOWED_COMMANDS.has('python3')).toBe(false))
  it('blocks ssh', () => expect(ALLOWED_COMMANDS.has('ssh')).toBe(false))
  it('blocks nc', () => expect(ALLOWED_COMMANDS.has('nc')).toBe(false))
})
