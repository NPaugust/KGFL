"use client"
import Image from 'next/image'
import { HorizontalCarousel } from './HorizontalCarousel'
import { useLatestMatches, useUpcomingMatches, useMatches } from '@/hooks/useMatches'
import { Loading } from './Loading'
import { formatDate } from '@/utils'
import { MapPin } from 'lucide-react'

type MatchCardProps = {
  date: string
  home: { name: string; logo: string; score?: number }
  away: { name: string; logo: string; score?: number }
  place?: string
}

function MatchCard({ date, home, away, place }: MatchCardProps) {
  const isFinished = home.score != null && away.score != null
  return (
    <div className="card p-4">
      <div className="mb-3 text-xs text-white/60">{date}{place ? ` · ${place}` : ''}</div>
      <div className="grid grid-cols-3 items-center gap-2 text-center">
        <div>
          <Image src={home.logo} alt={home.name} width={40} height={40} className="mx-auto h-10 w-10" />
          <div className="mt-1 text-sm text-white/80">{home.name}</div>
        </div>
        <div className="text-2xl font-bold">
          {isFinished ? (
            <span>{home.score} : {away.score}</span>
          ) : (
            <span className="text-white/60">vs</span>
          )}
        </div>
        <div>
          <Image src={away.logo} alt={away.name} width={40} height={40} className="mx-auto h-10 w-10" />
          <div className="mt-1 text-sm text-white/80">{away.name}</div>
        </div>
      </div>
      <div className="mt-4 flex justify-center">
        <button className="btn btn-outline px-4 py-2 text-sm">Подробнее</button>
      </div>
    </div>
  )
}

export function LatestMatches() {
  const { matches, loading, error } = useLatestMatches()

  if (loading) {
    return (
      <section id="matches" className="container-px py-16">
        <h2 className="mb-6 text-2xl font-bold text-center">Последние матчи</h2>
        <Loading />
      </section>
    )
  }

  if (error) {
    return (
      <section id="matches" className="container-px py-16">
        <h2 className="mb-6 text-2xl font-bold text-center">Последние матчи</h2>
        <div className="text-center text-red-400">
          Ошибка загрузки матчей: {typeof error === 'string' ? error : 'Неизвестная ошибка'}
        </div>
      </section>
    )
  }

  const items = matches.map((match) => ({
    id: match.id,
    content: (
      <MatchCard 
        date={formatDate(match.date)} 
        home={{ 
          name: match.home_team?.name || 'Неизвестная команда', 
          logo: match.home_team?.logo || '/logo.png.png', 
          score: match.home_score 
        }} 
        away={{ 
          name: match.away_team?.name || 'Неизвестная команда', 
          logo: match.away_team?.logo || '/logo.png.png', 
          score: match.away_score 
        }} 
        place={match.stadium}
      />
    )
  }))

  return (
    <section id="matches" className="container-px py-16">
      <h2 className="mb-6 text-2xl font-bold text-center">Последние матчи</h2>
      <HorizontalCarousel items={items} />
    </section>
  )
}

export function SeasonMatches({ withDetails }: { withDetails?: boolean }) {
  const { matches, loading, error } = useMatches()

  if (loading) {
    return (
      <section className="container-px py-16 reveal">
        <h2 className="mb-6 text-center text-2xl font-bold">Матчи сезона</h2>
        <Loading />
      </section>
    )
  }

  if (error) {
    return (
      <section className="container-px py-16 reveal">
        <h2 className="mb-6 text-center text-2xl font-bold">Матчи сезона</h2>
        <div className="text-center text-red-400">
          Ошибка загрузки матчей: {typeof error === 'string' ? error : 'Неизвестная ошибка'}
        </div>
      </section>
    )
  }

  const matchesArray = Array.isArray(matches) ? matches : []
  const items = matchesArray.slice(0, 6).map((match) => ({
    id: match.id,
    content: (
      <MatchCard 
        date={formatDate(match.date)} 
        home={{ 
          name: match.home_team?.name || 'Неизвестная команда', 
          logo: match.home_team?.logo || '/logo.png.png', 
          score: match.home_score 
        }} 
        away={{ 
          name: match.away_team?.name || 'Неизвестная команда', 
          logo: match.away_team?.logo || '/logo.png.png', 
          score: match.away_score 
        }} 
        place={match.stadium}
      />
    )
  }))

  return (
    <section className="container-px py-16 reveal">
      <h2 className="mb-6 text-center text-2xl font-bold">Матчи сезона</h2>
      <HorizontalCarousel items={items} />
    </section>
  )
}

export function UpcomingMatches() {
  const { matches, loading, error } = useUpcomingMatches()

  if (loading) {
    return (
      <section className="container-px py-16 reveal">
        <h2 className="mb-6 text-2xl font-bold text-center">Ближайшие матчи</h2>
        <Loading />
      </section>
    )
  }

  if (error) {
    return (
      <section className="container-px py-16 reveal">
        <h2 className="mb-6 text-2xl font-bold text-center">Ближайшие матчи</h2>
        <div className="text-center text-red-400">
          Ошибка загрузки матчей: {typeof error === 'string' ? error : 'Неизвестная ошибка'}
        </div>
      </section>
    )
  }

  const matchesArray = Array.isArray(matches) ? matches : []
  const items = matchesArray.map((match) => ({
    id: match.id,
    content: (
      <MatchCard 
        date={formatDate(match.date)} 
        home={{ 
          name: match.home_team?.name || 'Неизвестная команда', 
          logo: match.home_team?.logo || '/logo.png.png'
        }} 
        away={{ 
          name: match.away_team?.name || 'Неизвестная команда', 
          logo: match.away_team?.logo || '/logo.png.png'
        }} 
        place={match.stadium}
      />
    )
  }))

  return (
    <section className="container-px py-16 reveal">
      <h2 className="mb-6 text-2xl font-bold text-center">Ближайшие матчи</h2>
      <HorizontalCarousel items={items} />
    </section>
  )
}


