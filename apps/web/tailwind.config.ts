import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        terminal: {
          bg:      '#0a0a0a',
          surface: '#111111',
          raised:  '#161616',
          border:  '#1f1f1f',
          accent:  '#00ff88',
          'accent-dim': '#00cc6a',
          text:    '#e0e0e0',
          muted:   '#606060',
          dim:     '#404040',
          error:   '#ff4444',
          warn:    '#ffaa00',
        },
      },
      fontFamily: {
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      animation: {
        blink: 'blink 1s step-end infinite',
        'pulse-accent': 'pulse-accent 2s ease-in-out infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        'pulse-accent': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}

export default config
