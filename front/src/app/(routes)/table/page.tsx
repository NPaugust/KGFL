"use client"
import { LeagueTable } from '@/components/LeagueTable'
import { SeasonMatches } from '@/components/Matches'
import { useTopScorers } from '@/hooks/usePlayers'
import { Loading } from '@/components/Loading'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import Image from 'next/image'

function VerticalScorers() {
  const { scorers, loading, error } = useTopScorers()

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="pb-1 text-left text-lg font-semibold">Лучшие бомбардиры</h3>
        <Loading />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h3 className="pb-1 text-left text-lg font-semibold">Лучшие бомбардиры</h3>
        <div className="card p-4 text-center text-red-400">
          Ошибка загрузки данных
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="pb-1 text-left text-lg font-semibold">Лучшие бомбардиры</h3>
      {scorers.slice(0, 3).map((player) => (
        <div key={player.id} className="card p-4">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-primary/20 px-2 py-1 text-brand-accent text-xs">#{player.number || 0}</span>
            <div className="flex-1">
              <div className="font-medium leading-tight">{player.first_name} {player.last_name}</div>
              <div className="text-sm text-white/60">{player.club?.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-white/70">Голы</div>
              <div className="text-xl font-bold text-brand-accent">{player.goals_scored || 0}</div>
            </div>
          </div>
          <div className="mt-3 flex justify-center">
            <div className="relative h-12 w-12 overflow-hidden rounded-full">
              <Image
                src={player.photo || '/1.png'}
                alt={`${player.first_name} ${player.last_name}`}
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function TablePage() {
  return (
    <main>
      <section className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Таблица' }]} />
        <h1 className="text-4xl font-bold text-center">Таблица</h1>
        <p className="mt-2 text-white/70 text-center">Обновляется в реальном времени по окончании матчей</p>
      </section>
      <section className="container-px grid gap-6 pb-4 lg:grid-cols-3">
        <div className="lg:col-span-2 self-start">
          <LeagueTable headerMode="compact" hideSubtitle embedded />
        </div>
        <div className="self-start">
          <VerticalScorers />
        </div>
      </section>
      <SeasonMatches />
    </main>
  )
}


