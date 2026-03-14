import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const WEB_DIR = path.resolve(__dirname, '..')

describe('build smoke tests', () => {
  const cssDir = path.join(WEB_DIR, '.next/static/css')
  const manifestPath = path.join(WEB_DIR, '.next/build-manifest.json')

  it('should have compiled CSS files (not raw @tailwind directives)', () => {
    expect(fs.existsSync(cssDir), '.next/static/css directory must exist — run `npm run build` first').toBe(true)

    const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'))
    expect(cssFiles.length).toBeGreaterThan(0)

    for (const file of cssFiles) {
      const content = fs.readFileSync(path.join(cssDir, file), 'utf8')
      // Raw directives mean Tailwind was never compiled
      expect(content).not.toContain('@tailwind base')
      expect(content).not.toContain('@tailwind components')
      expect(content).not.toContain('@tailwind utilities')
      // Compiled Tailwind produces substantial CSS (at least 5KB)
      expect(content.length).toBeGreaterThan(5000)
    }
  })

  it('should have a build manifest referencing CSS', () => {
    // App Router uses app-build-manifest.json for CSS references
    const appManifestPath = path.join(WEB_DIR, '.next/app-build-manifest.json')
    const hasAppManifest = fs.existsSync(appManifestPath)
    const hasBuildManifest = fs.existsSync(manifestPath)
    expect(hasAppManifest || hasBuildManifest, 'a build manifest must exist').toBe(true)

    // Check app-build-manifest for CSS entries (App Router)
    if (hasAppManifest) {
      const manifest = JSON.parse(fs.readFileSync(appManifestPath, 'utf8'))
      const allEntries = Object.values(manifest.pages).flat() as string[]
      const hasCss = allEntries.some((e: string) => e.includes('.css'))
      expect(hasCss, 'app-build-manifest should reference at least one CSS file').toBe(true)
    }
  })

  it('should have standalone server output', () => {
    const standaloneServer = path.join(WEB_DIR, '.next/standalone/apps/web/server.js')
    expect(fs.existsSync(standaloneServer), 'standalone server.js must exist').toBe(true)
  })

  it('should have static assets copied to standalone directory', () => {
    const standaloneStatic = path.join(WEB_DIR, '.next/standalone/apps/web/.next/static')
    expect(fs.existsSync(standaloneStatic), 'static assets must be copied to standalone dir').toBe(true)

    // CSS should be there too
    const standaloneCss = path.join(standaloneStatic, 'css')
    expect(fs.existsSync(standaloneCss), 'CSS must be in standalone static dir').toBe(true)

    const cssFiles = fs.readdirSync(standaloneCss).filter(f => f.endsWith('.css'))
    expect(cssFiles.length).toBeGreaterThan(0)

    // Verify the standalone copy also has compiled CSS
    for (const file of cssFiles) {
      const content = fs.readFileSync(path.join(standaloneCss, file), 'utf8')
      expect(content.length).toBeGreaterThan(5000)
    }
  })

  it('should have postcss.config.js', () => {
    const configExists =
      fs.existsSync(path.join(WEB_DIR, 'postcss.config.js')) ||
      fs.existsSync(path.join(WEB_DIR, 'postcss.config.ts')) ||
      fs.existsSync(path.join(WEB_DIR, 'postcss.config.cjs')) ||
      fs.existsSync(path.join(WEB_DIR, 'postcss.config.mjs'))
    expect(configExists, 'postcss config must exist for Tailwind compilation').toBe(true)
  })
})
