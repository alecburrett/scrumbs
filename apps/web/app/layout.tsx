import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Scrumbs',
  description: 'AI-powered scrum team for solo developers',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
