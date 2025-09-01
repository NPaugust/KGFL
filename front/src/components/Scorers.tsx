"use client"
import Image from 'next/image'
import { useTopScorers } from '@/hooks/usePlayers'
import { Loading } from './Loading'
import Link from 'next/link'

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
        <div className="w-16 h-16 bg-brand-primary/20 rounded-full mb-4 flex items-center justify-center mx-auto">
          <span className="text-brand-primary font-bold text-2xl">Б</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-bold mb-2">Лучшие бомбардиры</h2>
        <p className="text-white/70 max-w-2xl mx-auto">
          Следите за лидерами по голам в текущем сезоне KGFL
        </p>
      </div>
      {scorersList.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-3">
          {scorersList.slice(0, 3).map((player) => (
            <div key={player.id} className="card p-6 text-center">
              <div className="flex items-center justify-center gap-3">
                <span className="rounded-full bg-brand-primary/20 px-2 py-1 text-brand-accent text-sm">#{player.number || 0}</span>
                <div className="flex items-center gap-2">
                  {player.club?.logo ? (
                    <Image 
                      src={player.club.logo.startsWith('http') ? player.club.logo : `/${player.club.logo}`} 
                      alt={player.club?.name || 'Клуб'} 
                      width={20} 
                      height={20} 
                    />
                  ) : (
                    <div className="w-5 h-5 bg-white/10 rounded flex items-center justify-center text-xs text-white/40">
                      {player.club?.name?.[0] || 'К'}
                    </div>
                  )}
                  <span className="text-white/80 text-sm">{player.club?.name || 'Неизвестный клуб'}</span>
                </div>
              </div>
              <h3 className="mt-3 text-xl font-semibold">{player.first_name} {player.last_name}</h3>
              <p className="text-white/70">{player.club?.name}</p>
              <div className="my-4 flex items-center justify-center">
                <div className="relative h-40 w-40 overflow-hidden rounded-full ring-4 ring-white/10">
                  {player.photo ? (
                    <Image 
                      src={player.photo.startsWith('http') ? player.photo : `/${player.photo}`} 
                      alt={`${player.first_name} ${player.last_name}`}
                      fill 
                      className="object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-4xl text-white/40 font-bold">
                      {player.first_name?.[0]}{player.last_name?.[0]}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 text-sm text-white/70">Голы</div>
              <div className="text-4xl font-black text-brand-accent">{player.goals_scored || 0}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-brand-primary/20 rounded-full mb-4 flex items-center justify-center mx-auto">
            <span className="text-brand-primary font-bold text-3xl">Б</span>
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


