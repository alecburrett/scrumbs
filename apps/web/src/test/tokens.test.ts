import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const css = readFileSync(resolve(__dirname, '../../src/app/globals.css'), 'utf-8')

describe('persona colour tokens (Tailwind v4 CSS custom properties)', () => {
  const personas = ['pablo', 'stella', 'viktor', 'rex', 'quinn', 'dex', 'max']

  it('defines all 7 persona colour tokens in globals.css', () => {
    personas.forEach(name => {
      expect(css).toContain(`--color-persona-${name}`)
    })
  })

  it('pablo is warm amber #F59E0B', () => {
    expect(css).toContain('--color-persona-pablo: #F59E0B')
  })

  it('defines terminal colour tokens', () => {
    expect(css).toContain('--color-terminal-bg')
    expect(css).toContain('--color-terminal-success')
    expect(css).toContain('--color-terminal-error')
  })
})
