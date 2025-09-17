"use client"
import Image from 'next/image'
import { getImageUrl } from '@/utils'
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

        <h2 className="text-3xl md:text-4xl font-bold mb-2">Лучшие бомбардиры</h2>
        <p className="text-white/70 max-w-2xl mx-auto">
          Следите за лидерами по голам в текущем сезоне KGFL
        </p>
      </div>
      {scorersList.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-4">
          {scorersList.slice(0, 3).map((player, index) => (
            <Link key={player.id} href={`/clubs/${player.club?.id}?player=${player.id}`}>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group">
                {/* Верхняя часть - номер игрока и голы */}
                <div className="flex items-center justify-between mb-6">
                  <div className="text-white/60 text-sm font-medium">#{player.number || 0}</div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-brand-accent">{player.goals_scored || 0}</div>
                    <div className="text-xs text-white/60">голов</div>
                  </div>
                </div>
                
                {/* Большое фото игрока */}
                <div className="flex justify-center mb-6">
                  <div className="w-44 h-44 rounded-2xl overflow-hidden border-2 border-white/20 group-hover:border-brand-primary/50 transition-colors">
                    {(player as any).photo_url || player.photo ? (
                      <Image 
                        src={(player as any).photo_url || (player.photo ? getImageUrl(player.photo) : '')} 
                        alt={`${player.first_name} ${player.last_name}`}
                        width={128}
                        height={128}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                      />
                    ) : (
                      <div className="w-full h-full bg-white/10 flex items-center justify-center text-3xl text-white/40 font-bold">
                        {player.first_name?.[0]}{player.last_name?.[0]}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Имя игрока */}
                <h3 className="text-xl font-bold text-white text-center mb-4 group-hover:text-brand-primary transition-colors">
                  {player.first_name} {player.last_name}
                </h3>
                
                {/* Клуб с большим логотипом */}
                <div className="flex items-center justify-center gap-3">
                  {player.club?.logo ? (
                    <Image 
                      src={getImageUrl(player.club.logo)} 
                      alt={player.club?.name || 'Клуб'} 
                      width={32} 
                      height={32} 
                      className="rounded-lg"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-sm text-white/40">
                      {player.club?.name?.[0] || 'К'}
                    </div>
                  )}
                  <span className="text-white/90 text-base font-semibold">{player.club?.name || 'Неизвестный клуб'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-40 h-40 bg-brand-primary/20 rounded-full mb-4 flex items-center justify-center mx-auto">
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


