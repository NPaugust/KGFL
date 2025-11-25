import dynamic from 'next/dynamic'
import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { LeagueTable } from '@/components/LeagueTable'
import { SeasonLoader } from '@/components/SeasonLoader'

// Динамическая загрузка компонентов ниже fold для улучшения производительности
const Scorers = dynamic(() => import('@/components/Scorers').then(mod => ({ default: mod.Scorers })), {
  ssr: true
})

const LatestMatches = dynamic(() => import('@/components/Matches').then(mod => ({ default: mod.LatestMatches })), {
  ssr: true
})

const UpcomingMatches = dynamic(() => import('@/components/Matches').then(mod => ({ default: mod.UpcomingMatches })), {
  ssr: true
})

const Partners = dynamic(() => import('@/components/Partners').then(mod => ({ default: mod.Partners })), {
  ssr: true
})

const Footer = dynamic(() => import('@/components/Footer').then(mod => ({ default: mod.Footer })), {
  ssr: true
})

export default function HomePage() {
  return (
    <main>
      <SeasonLoader />
      <Header />
      <Hero />
      <LeagueTable />
      <Scorers />
      <LatestMatches />
      <UpcomingMatches />
      <Partners />
      <Footer />
    </main>
  )
}


