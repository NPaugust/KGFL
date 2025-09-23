"use client"
import Image from 'next/image'
import { getImageUrl } from '@/utils'
import Link from 'next/link'
import { HorizontalCarousel } from './HorizontalCarousel'
import { useLatestMatches, useUpcomingMatches, useMatches } from '@/hooks/useMatches'
import { Loading } from './Loading'
import { formatDate } from '@/utils'
import { MapPin } from 'lucide-react'

type MatchCardProps = {
  id: string
  date: string
  time?: string
  home: { name: string; logo: string; score?: number }
  away: { name: string; logo: string; score?: number }
  place?: string
}

function toHHMM(t?: string) {
  if (!t) return ''
  // ожидается форматы HH:MM или HH:MM:SS
  const parts = t.split(':')
  if (parts.length >= 2) return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`
  return t
}

function MatchCard({ id, date, time, home, away, place }: MatchCardProps) {
  const isFinished = home.score != null && away.score != null
  return (
    <div className="card p-4">
      <div className="mb-5 text-sm text-white/70 text-center">
        {date}{time ? ` · ${toHHMM(time)}` : ''}
        {place && (
          <div className="flex items-center justify-center mt-1 text-xs">
            <MapPin className="w-3 h-3 mr-1" />
            {place}
          </div>
        )}
      </div>
      <div className="grid grid-cols-3 items-center gap-2 text-center">
        <div className="flex flex-col items-center justify-center">
          {home.logo ? (
            <Image 
              src={getImageUrl(home.logo)} 
              alt={home.name} 
              width={80} 
              height={80} 
              className="h-20 w-20 mb-2" 
            />
          ) : (
            <div className="h-20 w-20 bg-white/10 rounded flex items-center justify-center text-sm text-white/40 mb-2">
              {home.name?.[0] || 'К'}
            </div>
          )}
          <span className="text-sm text-white font-medium">{home.name}</span>
        </div>
        <div className="text-3xl font-bold">
          {isFinished ? (
            <span>{home.score} : {away.score}</span>
          ) : (
            <span className="text-white/60">vs</span>
          )}
        </div>
        <div className="flex flex-col items-center justify-center">
          {away.logo ? (
            <Image 
              src={getImageUrl(away.logo)} 
              alt={away.name} 
              width={80} 
              height={80} 
              className="h-20 w-20 mb-2" 
            />
          ) : (
            <div className="h-20 w-20 bg-white/10 rounded flex items-center justify-center text-sm text-white/40 mb-2">
              {away.name?.[0] || 'К'}
            </div>
          )}
          <span className="text-sm text-white font-medium">{away.name}</span>
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <Link href={`/matches/${id}`} className="btn btn-outline px-5 py-2 text-sm">
          Подробнее
        </Link>
      </div>
    </div>
  )
}

function EmptyMatchCard({ text = "Матчи не найдены" }: { text?: string }) {
  return (
    <div className="card p-8 h-full flex items-center justify-center text-center text-white/60">
      {text}
    </div>
  )
}

export function LatestMatches() {
  const { matches, loading, error } = useLatestMatches()

  if (loading) {
    return (
      <section id="matches" className="container-px py-16">
        <h2 className="mb-6 text-3xl font-bold text-center">Последние матчи</h2>
        <Loading />
      </section>
    )
  }

  if (error) {
    return (
      <section id="matches" className="container-px py-16">
        <h2 className="mb-6 text-3xl font-bold text-center">Последние матчи</h2>
        <div className="text-center text-red-400">
          Ошибка загрузки матчей: {typeof error === 'string' ? error : 'Неизвестная ошибка'}
        </div>
      </section>
    )
  }

  const items = matches.map((match: any) => ({
    id: match.id,
    content: (
      <MatchCard 
        id={match.id}
        date={formatDate(match.date)}
        time={(match as any).time}
        home={{ 
          name: match.home_team?.name || 'Неизвестная команда', 
          logo: match.home_team?.logo || '', 
          score: match.home_score 
        }} 
        away={{ 
          name: match.away_team?.name || 'Неизвестная команда', 
          logo: match.away_team?.logo || '', 
          score: match.away_score 
        }} 
        place={match.stadium}
      />
    )
  }))

  return (
    <section id="matches" className="container-px py-16">
      <h2 className="mb-6 text-3xl font-bold text-center">Последние матчи</h2>
      <HorizontalCarousel items={items} />
      <div className="mt-8 text-center">
        <Link href="/schedule" className="btn btn-primary">
          Все матчи
        </Link>
      </div>
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
        id={match.id}
        date={formatDate(match.date)}
        time={(match as any).time}
        home={{ 
          name: match.home_team?.name || 'Неизвестная команда', 
          logo: match.home_team?.logo || '', 
          score: match.home_score 
        }} 
        away={{ 
          name: match.away_team?.name || 'Неизвестная команда', 
          logo: match.away_team?.logo || '', 
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
      <div className="mt-8 text-center">
        <Link href="/schedule" className="btn btn-primary">
          Все матчи
        </Link>
      </div>
    </section>
  )
}

export function UpcomingMatches() {
  const { matches, loading, error } = useUpcomingMatches()

  if (loading) {
    return (
      <section className="container-px py-16 reveal">
        <h2 className="mb-6 text-3xl font-bold text-center">Ближайшие матчи</h2>
        <Loading />
      </section>
    )
  }

  if (error) {
    return (
      <section className="container-px py-16 reveal">
        <h2 className="mb-6 text-3xl font-bold text-center">Ближайшие матчи</h2>
        <div className="text-center text-red-400">
          Ошибка загрузки матчей: {typeof error === 'string' ? error : 'Неизвестная ошибка'}
        </div>
      </section>
    )
  }

  const matchesArray = Array.isArray(matches) ? matches : []
  const items = (matchesArray.length ? matchesArray : [{ id: 'empty' } as any]).map((match: any) => ({
    id: match.id,
    content: (
      match.id === 'empty' ? (
        <EmptyMatchCard />
      ) : (
        <MatchCard 
          id={match.id}
          date={formatDate(match.date)}
          time={(match as any).time}
          home={{ 
            name: match.home_team?.name || 'Неизвестная команда', 
            logo: match.home_team?.logo || ''
          }} 
          away={{ 
            name: match.away_team?.name || 'Неизвестная команда', 
            logo: match.away_team?.logo || ''
          }} 
          place={match.stadium}
        />
      )
    )
  }))

  return (
    <section className="container-px py-16 reveal">
      <h2 className="mb-6 text-3xl font-bold text-center">Ближайшие матчи</h2>
      <HorizontalCarousel items={items} />
      <div className="mt-8 text-center">

      </div>
    </section>
  )
}


