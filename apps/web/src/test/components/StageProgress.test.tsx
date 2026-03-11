import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { StageProgress } from '@/components/dashboard/StageProgress'

describe('StageProgress', () => {
  it('renders all 7 stage labels', () => {
    render(<StageProgress currentStage="development" completedStages={[]} />)
    expect(screen.getByText('Planning')).toBeInTheDocument()
    expect(screen.getByText('Development')).toBeInTheDocument()
    expect(screen.getByText('Deploy')).toBeInTheDocument()
  })
  it('marks current stage', () => {
    render(<StageProgress currentStage="development" completedStages={[]} />)
    expect(screen.getByTestId('stage-development')).toHaveClass('current')
  })
  it('marks completed stages', () => {
    render(<StageProgress currentStage="development" completedStages={['planning', 'setup']} />)
    expect(screen.getByTestId('stage-planning')).toHaveClass('completed')
  })
})
