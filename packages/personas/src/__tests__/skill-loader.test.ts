import { describe, it, expect } from 'vitest'
import { SKILL_CONTENT, getSkill } from '../skill-loader.js'

describe('skill-loader', () => {
  it('loads all 12 skill files', () => {
    const expected = [
      'brainstorming', 'test-driven-development', 'using-superpowers',
      'systematic-debugging', 'subagent-driven-development', 'writing-plans',
      'requesting-code-review', 'receiving-code-review', 'verification-before-completion',
      'finishing-a-development-branch', 'using-git-worktrees', 'executing-plans',
    ]
    for (const name of expected) {
      expect(getSkill(name), `skill "${name}" should be loaded`).not.toBe('')
    }
  })

  it('returns empty string for unknown skills', () => {
    expect(getSkill('nonexistent')).toBe('')
  })
})
