import { describe, it, expect } from 'vitest'
import { getTableConfig } from 'drizzle-orm/pg-core'
import { sprints } from '../projects.js'

describe('projects schema', () => {
  it('sprints table has unique constraint on (projectId, number)', () => {
    const config = getTableConfig(sprints)
    const hasUniqueIdx = config.uniqueConstraints.some(uc => {
      const colNames = uc.columns.map(c => c.name)
      return colNames.includes('project_id') && colNames.includes('number')
    })
    expect(hasUniqueIdx).toBe(true)
  })
})
