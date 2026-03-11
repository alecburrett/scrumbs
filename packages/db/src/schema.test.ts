import { describe, it, expect } from 'vitest'
import { users, accounts, projects, sprints, stories, artifacts, conversations, agentTasks } from './schema'

describe('database schema', () => {
  it('projects has required columns', () => {
    expect(Object.keys(projects)).toContain('id')
    expect(Object.keys(projects)).toContain('userId')
    expect(Object.keys(projects)).toContain('githubRepo')
  })

  it('sprints has required columns', () => {
    expect(Object.keys(sprints)).toContain('projectId')
    expect(Object.keys(sprints)).toContain('number')
    expect(Object.keys(sprints)).toContain('status')
  })

  it('agentTasks has sessionId for SSE reconnection', () => {
    expect(Object.keys(agentTasks)).toContain('sessionId')
    expect(Object.keys(agentTasks)).toContain('status')
    expect(Object.keys(agentTasks)).toContain('sprintId')
  })

  it('artifacts can be project-level (nullable sprintId)', () => {
    expect(Object.keys(artifacts)).toContain('projectId')
    expect(Object.keys(artifacts)).toContain('sprintId')
  })
})
