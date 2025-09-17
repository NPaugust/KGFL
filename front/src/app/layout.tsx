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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'KGFL — Кыргызская футбольная лига',
    description: 'Матчи, таблица, расписание и статистика KGFL',
    url: '/',
    siteName: 'KGFL',
    images: [
      { url: '/og.jpg', width: 1200, height: 630, alt: 'KGFL' },
    ],
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KGFL — Кыргызская футбольная лига',
    description: 'Матчи, таблица, расписание и статистика KGFL',
    images: ['/og.jpg'],
  },
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


