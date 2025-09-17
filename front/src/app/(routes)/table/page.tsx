"use client"
import { LeagueTable } from '@/components/LeagueTable'
import { SeasonMatches } from '@/components/Matches'
import { useTopScorers } from '@/hooks/usePlayers'
import { Loading } from '@/components/Loading'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { getImageUrl } from '@/utils'
import Image from 'next/image'

function VerticalScorers() {
  const { topScorers, loading, error } = useTopScorers()

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
    <div className="space-y-5">
      <h3 className="pb-1 text-left text-lg font-semibold">Лучшие бомбардиры</h3>
      {topScorers.slice(0, 3).map((player, index) => (
        <div key={player.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300 group">
          <div className="flex items-center gap-4">
            {/* Левая часть - статистика голов */}
            <div className="flex-shrink-0 text-center">
              <div className="text-3xl font-black text-brand-accent">{player.goals_scored || 0}</div>
              <div className="text-xs text-white/60">голов</div>
            </div>
            
            {/* Центральная часть - информация об игроке */}
            <div className="flex-1">
              {/* Имя игрока */}
              <h4 className="font-bold text-brand-accent text-base mb-2 group-hover:text-white transition-colors">
                {player.first_name} {player.last_name}
              </h4>
              
              {/* Клуб с логотипом */}
              <div className="flex items-center gap-2">
                {player.club?.logo ? (
                  <Image 
                    src={getImageUrl(player.club.logo)} 
                    alt={player.club?.name || 'Клуб'} 
                    width={24} 
                    height={24} 
                    className="rounded"
                  />
                ) : (
                  <div className="w-6 h-6 bg-white/10 rounded flex items-center justify-center text-xs text-white/40">
                    {player.club?.name?.[0] || 'К'}
                  </div>
                )}
                <span className="text-white/90 text-sm font-semibold">{player.club?.name || 'Неизвестный клуб'}</span>
              </div>
            </div>
            
            {/* Правая часть - фото игрока с номером */}
            <div className="flex-shrink-0 relative">
              <div className="w-20 h-20 rounded-xl overflow-hidden border-2 border-white/20 group-hover:border-brand-primary/50 transition-colors">
                {((player as any).photo_url || player.photo) ? (
                  <Image
                    src={(player as any).photo_url || getImageUrl(player.photo || '')}
                    alt={`${player.first_name} ${player.last_name}`}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-white/10 flex items-center justify-center text-xl text-white/40 font-bold">
                    {player.first_name?.[0]}{player.last_name?.[0]}
                  </div>
                )}
              </div>
              {/* Номер игрока как кнопка */}
              <div className="absolute -top-2 -right-2 w-7 h-7 bg-brand-primary rounded-lg flex items-center justify-center border-2 border-white/20">
                <span className="text-white font-bold text-xs">#{player.number || 0}</span>
              </div>
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


