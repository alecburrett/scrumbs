import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Sidebar } from '@/components/dashboard/Sidebar'

describe('Sidebar', () => {
  it('renders project name', () => {
    render(<Sidebar projects={[{ id: '1', name: 'My App', githubRepo: 'a/b', status: 'active' }]} currentProjectId={null} />)
    expect(screen.getByText('My App')).toBeInTheDocument()
  })
  it('renders new project link', () => {
    render(<Sidebar projects={[]} currentProjectId={null} />)
    expect(screen.getByText('New Project')).toBeInTheDocument()
  })
})
