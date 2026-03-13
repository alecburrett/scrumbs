import { describe, it, expect } from 'vitest'
import { estimateTokens } from '../context-window.js'

describe('estimateTokens', () => {
  it('estimates based on character count / 4', () => {
    const messages = [{ role: 'user' as const, content: 'x'.repeat(400) }]
    const estimate = estimateTokens(messages)
    expect(estimate).toBeGreaterThan(90)
    expect(estimate).toBeLessThan(200)
  })

  it('returns 0 for empty messages', () => {
    expect(estimateTokens([])).toBeLessThanOrEqual(10)
  })
})
