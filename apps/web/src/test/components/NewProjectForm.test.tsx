import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { NewProjectForm } from '@/components/project/NewProjectForm'

describe('NewProjectForm', () => {
  it('shows validation error for invalid repo', async () => {
    render(<NewProjectForm onSubmit={vi.fn()} />)
    fireEvent.change(screen.getByLabelText('GitHub Repository'), { target: { value: 'notvalid' } })
    fireEvent.blur(screen.getByLabelText('GitHub Repository'))
    expect(await screen.findByText(/owner\/repo format/i)).toBeInTheDocument()
  })
  it('calls onSubmit with correct data', () => {
    const onSubmit = vi.fn()
    render(<NewProjectForm onSubmit={onSubmit} />)
    fireEvent.change(screen.getByLabelText('Project Name'), { target: { value: 'My App' } })
    fireEvent.change(screen.getByLabelText('GitHub Repository'), { target: { value: 'owner/my-app' } })
    fireEvent.click(screen.getByText('Create Project'))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ name: 'My App', githubRepo: 'owner/my-app' }))
  })
})
