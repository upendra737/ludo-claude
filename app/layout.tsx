import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Ludo — Multiplayer',
  description: 'Real-time multiplayer Ludo with 3D dice, sounds, and emoji reactions',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-950 antialiased">{children}</body>
    </html>
  )
}
