import { Header } from '@/components/Header'
import { Hero } from '@/components/Hero'
import { LeagueTable } from '@/components/LeagueTable'
import { Scorers } from '@/components/Scorers'
import { LatestMatches, UpcomingMatches } from '@/components/Matches'
import { Partners } from '@/components/Partners'
import { Footer } from '@/components/Footer'
import { SeasonLoader } from '@/components/SeasonLoader'

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


