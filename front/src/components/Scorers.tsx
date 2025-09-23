"use client"
import { getImageUrl } from '@/utils'
import { useTopScorers } from '@/hooks/usePlayers'
import { Loading } from './Loading'
import Link from 'next/link'
import { TopScorerCard } from './TopScorerCard'

export function Scorers() {
  const { topScorers, loading, error } = useTopScorers()

  if (loading) {
    return (
      <section id="scorers" className="container-px py-16 reveal">
        <h2 className="mb-6 text-2xl font-bold text-center">Лучшие бомбардиры</h2>
        <div className="flex justify-center">
          <Loading />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section id="scorers" className="container-px py-16 reveal">
        <h2 className="mb-6 text-2xl font-bold text-center">Лучшие бомбардиры</h2>
        <div className="text-center text-red-400">
          Ошибка загрузки данных
        </div>
      </section>
    )
  }

  const scorersList = Array.isArray(topScorers) ? topScorers : []

  return (
    <section id="scorers" className="container-px py-16 reveal">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-4xl font-bold mb-2">Лучшие бомбардиры</h2>
        <p className="text-white/70 max-w-2xl mx-auto">Следите за лидерами по голам в текущем сезоне KGFL</p>
      </div>
      {scorersList.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {scorersList.slice(0, 6).map((player, index) => (
            <TopScorerCard
              key={player.id}
              player={player}
              layout="horizontal"
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-40 h-40 bg-brand-primary/20 rounded-full mb-4 flex items-center justify-center mx-auto">
            <span className="text-brand-primary font-bold text-2xl">Б</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Бомбардиры не найдены</h3>
          <p className="text-white/70">Данные о лучших бомбардирах будут доступны после начала сезона</p>
        </div>
      )}
      
      <div className="mt-8 text-center">
        <Link href="/stats" className="btn btn-primary">
          Статистика игроков
        </Link>
      </div>
    </section>
  )
}


