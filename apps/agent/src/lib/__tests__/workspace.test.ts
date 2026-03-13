import { describe, it, expect } from 'vitest'
import { validateWorkspacePath, validateRepoFormat } from '../workspace.js'

describe('validateWorkspacePath', () => {
  it('allows paths within workspace', () => {
    expect(() => validateWorkspacePath('/tmp/scrumbs/abc', 'src/index.ts')).not.toThrow()
  })

  it('rejects path traversal via ../', () => {
    expect(() => validateWorkspacePath('/tmp/scrumbs/abc', '../other/secret')).toThrow('Path traversal')
  })

  it('rejects prefix collision (abc vs abc-evil)', () => {
    expect(() => validateWorkspacePath('/tmp/scrumbs/abc', '../abc-evil/file')).toThrow('Path traversal')
  })

  it('allows the workspace root itself', () => {
    expect(() => validateWorkspacePath('/tmp/scrumbs/abc', '.')).not.toThrow()
  })
})

describe('validateRepoFormat', () => {
  it('accepts valid owner/repo', () => {
    expect(() => validateRepoFormat('alecburrett/scrumbs')).not.toThrow()
  })

  it('accepts repos with dots and hyphens', () => {
    expect(() => validateRepoFormat('my-org/my.project-v2')).not.toThrow()
  })

  it('rejects repos with special characters', () => {
    expect(() => validateRepoFormat('owner/@evil')).toThrow()
  })

  it('rejects repos with path traversal', () => {
    expect(() => validateRepoFormat('../../etc/passwd')).toThrow()
  })

  it('rejects empty string', () => {
    expect(() => validateRepoFormat('')).toThrow()
  })
})
