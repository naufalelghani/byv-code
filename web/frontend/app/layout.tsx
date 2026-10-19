import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'byv-code web',
  description: 'Web version of Claude Code — agentic coding in your browser.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body
        className={`${inter.variable} font-sans antialiased h-full overflow-hidden bg-claude-bg text-claude-text`}
      >
        {children}
      </body>
    </html>
  )
}
