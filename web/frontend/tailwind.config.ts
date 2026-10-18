import type { Config } from 'tailwindcss'
import typography from '@tailwindcss/typography'

/**
 * Tailwind config — mirrors claude.ai web aesthetic.
 * - Dark mode default (claude.ai defaults to dark)
 * - Font: system-ui / -apple-system (SF Pro / Segoe UI)
 * - Custom colors aligned to Claude web design tokens
 */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Claude web UI color palette
        'claude-bg': '#191919',
        'claude-bg-secondary': '#252526',
        'claude-border': '#373737',
        'claude-text': '#e4e4e7',
        'claude-text-secondary': '#a1a1aa',
        'claude-accent': '#0894da', // Claude blue
        'claude-accent-hover': '#0c86d9',
      },
      fontFamily: {
        'code': ['ui-monospace', 'monospace'],
        'sans': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [typography],
} satisfies Config
