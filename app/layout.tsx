import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Ludo — Multiplayer',
  description: 'Real-time multiplayer Ludo with 3D dice, sounds, and emoji reactions',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full bg-slate-950 antialiased">{children}</body>
    </html>
  )
}
