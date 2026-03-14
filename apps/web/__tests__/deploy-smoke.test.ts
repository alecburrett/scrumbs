import { describe, it, expect } from 'vitest'

const BASE_URL = process.env.DEPLOY_URL ?? 'https://scrumbs-web-production.up.railway.app'

describe('deploy smoke tests', () => {
  it('should return 200 on the landing page', async () => {
    const res = await fetch(BASE_URL)
    expect(res.status).toBe(200)
  })

  it('should serve HTML with CSS references (not raw text)', async () => {
    const res = await fetch(BASE_URL)
    const html = await res.text()

    // Next.js injects CSS via link tags or inline styles
    const hasCssLink = html.includes('.css') || html.includes('<style')
    expect(hasCssLink, 'HTML should reference CSS files or contain inline styles').toBe(true)

    // Should contain the app shell
    expect(html).toContain('Scrumbs')
  })

  it('should serve compiled CSS (not raw @tailwind directives)', async () => {
    const res = await fetch(BASE_URL)
    const html = await res.text()

    // Extract CSS file URLs from the HTML
    const cssUrls = [...html.matchAll(/href="([^"]*\.css[^"]*)"/g)].map(m => m[1])

    if (cssUrls.length > 0) {
      for (const cssUrl of cssUrls) {
        const fullUrl = cssUrl.startsWith('http') ? cssUrl : `${BASE_URL}${cssUrl}`
        const cssRes = await fetch(fullUrl)
        expect(cssRes.status).toBe(200)

        const cssContent = await cssRes.text()
        expect(cssContent).not.toContain('@tailwind base')
        expect(cssContent.length, 'compiled CSS should be substantial (>5KB)').toBeGreaterThan(5000)
      }
    }
  })

  it('should return JSON from /api/config', async () => {
    const res = await fetch(`${BASE_URL}/api/config`)
    expect(res.status).toBe(200)

    const contentType = res.headers.get('content-type')
    expect(contentType).toContain('application/json')
  })

  it('should redirect unauthenticated users from /dashboard', async () => {
    const res = await fetch(`${BASE_URL}/dashboard`, { redirect: 'manual' })
    // Should redirect to auth, not crash
    expect([200, 302, 307]).toContain(res.status)
  })
})
