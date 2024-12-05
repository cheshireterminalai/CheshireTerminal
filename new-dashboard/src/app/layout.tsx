import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Cheshire Cat Dashboard',
  description: 'Monitor tweets and AI thoughts from the Cheshire Cat bot',
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
