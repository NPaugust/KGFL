import type { Metadata } from 'next'
import './globals.css'
import { Manrope, Russo_One } from 'next/font/google'
import { RevealProvider } from '@/components/RevealProvider'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const manrope = Manrope({ subsets: ['latin', 'cyrillic'], weight: ['300','400','600','700','800'], variable: '--font-manrope' })
const russo = Russo_One({ subsets: ['latin', 'cyrillic'], weight: '400', variable: '--font-russo' })

export const metadata: Metadata = {
  title: 'KGFL — Кыргызская футбольная лига',
  description: 'Официальный сайт Кыргызской футбольной лиги (KGFL) — турниры, расписание, результаты, таблицы.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="bg-brand-dark text-white">
      <body className={`min-h-screen antialiased ${manrope.variable} ${russo.variable} font-sans`}>
        <div className="bg-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
        <ErrorBoundary>
          <RevealProvider>
            {children}
          </RevealProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}


