"use client"
import { LeagueTable } from '@/components/LeagueTable'
import { SeasonMatches } from '@/components/Matches'
import { useTopScorers } from '@/hooks/usePlayers'
import { Loading } from '@/components/Loading'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { TopScorerCard } from '@/components/TopScorerCard'

function VerticalScorers() {
  const { topScorers, loading, error } = useTopScorers()

  if (loading) {
    return (
      <div className="space-y-4 pt-1">
        <h3 className="pb-5 text-left text-lg font-semibold">Лучшие бомбардиры</h3>
        <Loading />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4 pt-1">
        <h3 className="pb-5 text-left text-lg font-semibold">Лучшие бомбардиры</h3>
        <div className="card p-4 text-center text-red-400">
          Ошибка загрузки данных
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 pt-1">
      <h3 className="pb-5 text-left text-lg font-semibold">Лучшие бомбардиры</h3>
      {topScorers.slice(0, 3).map((player, index) => (
        <TopScorerCard
          key={player.id}
          player={player}
          layout="vertical"
          index={index}
        />
      ))}
    </div>
  )
}

export default function TablePage() {
  return (
    <main>
      <section className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Таблица' }]} />
        <h1 className="text-4xl font-bold text-center">Турнирная Таблица</h1>
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


