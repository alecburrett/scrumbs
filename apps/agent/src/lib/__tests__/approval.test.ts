import { describe, it, expect } from 'vitest'
import { waitForApproval, resolveApproval } from '../approval.js'

describe('approval gate', () => {
  it('resolves when approval arrives after wait', async () => {
    const promise = waitForApproval('task-1')
    setTimeout(() => resolveApproval('task-1', true), 10)
    expect(await promise).toBe(true)
  })

  it('handles correct ordering: wait registered before resolve', async () => {
    const promise = waitForApproval('task-2')
    setTimeout(() => resolveApproval('task-2', false), 5)
    expect(await promise).toBe(false)
  })
})
