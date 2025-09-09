"use client"
import { useEffect } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Loading } from '@/components/Loading'
import { usePlayers } from '@/hooks/usePlayers'
import Image from 'next/image'
import { Trophy, Target, Users, Award } from 'lucide-react'

export default function StatsPage() {
  const { players, loading, error, refetch } = usePlayers()
  
  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      const refreshTypes = ['match', 'player', 'player_stats', 'club', 'transfer']
      if (refreshTypes.includes(event.detail.type)) {
        console.log('Обновляем статистику игроков...', event.detail.type)
        refetch()
      }
    }

    window.addEventListener('data-refresh', handleDataRefresh as EventListener)
    return () => {
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener)
    }
  }, [refetch])

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs items={[{ label: 'Статистика' }]} />
          <h1 className="text-3xl font-bold text-center">Статистика игроков</h1>
          <div className="flex justify-center mt-8">
            <Loading />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs items={[{ label: 'Статистика' }]} />
          <h1 className="text-3xl font-bold text-center">Статистика игроков</h1>
          <div className="text-center text-red-400 mt-8">
            Ошибка загрузки данных: {typeof error === 'string' ? error : 'Неизвестная ошибка'}
          </div>
        </div>
      </div>
    )
  }

  const playersList = Array.isArray(players) ? players : []

  if (playersList.length === 0) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs items={[{ label: 'Статистика' }]} />
          <h1 className="text-3xl font-bold text-center">Статистика игроков</h1>
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-brand-primary/20 rounded-full mb-4 flex items-center justify-center mx-auto">
              <Trophy className="w-10 h-10 text-brand-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Статистика не найдена</h3>
            <p className="text-white/70">Статистика игроков будет доступна после начала сезона</p>
          </div>
        </div>
      </div>
    )
  }

  // Сортируем игроков по голам
  const topScorers = [...playersList]
    .filter(player => (player.goals_scored || 0) > 0)
    .sort((a, b) => (b.goals_scored || 0) - (a.goals_scored || 0))
    .slice(0, 10)

  // Сортируем игроков по ассистам (если есть)
  const topAssisters = [...playersList]
    .filter(player => (player.assists || 0) > 0)
    .sort((a, b) => (b.assists || 0) - (a.assists || 0))
    .slice(0, 10)

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Статистика' }]} />
        <h1 className="text-3xl font-bold text-center mb-8">Статистика игроков</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Scorers */}
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Target className="w-6 h-6 mr-2 text-brand-primary" />
              Лучшие бомбардиры
            </h2>
            
            {topScorers.length > 0 ? (
              <div className="space-y-4">
                {topScorers.map((player, index) => (
                  <div key={player.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                    <div className="w-8 h-8 bg-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary font-bold">
                      {index + 1}
                    </div>
                    
                    <div className="w-12 h-12 relative">
                      {(player as any).photo_url || player.photo ? (
                        <Image 
                          src={(player as any).photo_url || player.photo} 
                          alt={`${player.first_name} ${player.last_name}`} 
                          width={48} 
                          height={48} 
                          className="rounded-full object-contain bg-transparent"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-lg text-white/40 font-bold">
                          {player.first_name?.[0]}{player.last_name?.[0]}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {player.first_name} {player.last_name}
                      </div>
                      <div className="text-sm text-white/70">
                        {player.club?.name || 'Без клуба'}
                      </div>
                    </div>
                    
                    <div className="text-xl font-bold text-brand-primary">
                      {player.goals_scored || 0}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-white/70 py-8">
                Данные о голах пока недоступны
              </div>
            )}
          </div>
          
          {/* Top Assisters */}
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Award className="w-6 h-6 mr-2 text-brand-primary" />
              Лучшие ассистенты
            </h2>
            
            {topAssisters.length > 0 ? (
              <div className="space-y-4">
                {topAssisters.map((player, index) => (
                  <div key={player.id} className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                    <div className="w-8 h-8 bg-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary font-bold">
                      {index + 1}
                    </div>
                    
                    <div className="w-12 h-12 relative">
                      {(player as any).photo_url || player.photo ? (
                        <Image 
                          src={(player as any).photo_url || player.photo} 
                          alt={`${player.first_name} ${player.last_name}`} 
                          width={48} 
                          height={48} 
                          className="rounded-full object-contain bg-transparent"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-lg text-white/40 font-bold">
                          {player.first_name?.[0]}{player.last_name?.[0]}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {player.first_name} {player.last_name}
                      </div>
                      <div className="text-sm text-white/70">
                        {player.club?.name || 'Без клуба'}
                      </div>
                    </div>
                    
                    <div className="text-xl font-bold text-brand-primary">
                      {player.assists || 0}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-white/70 py-8">
                Данные об ассистах пока недоступны
              </div>
            )}
          </div>
        </div>
        
        {/* All Players Table */}
        <div className="mt-8 card p-6">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Users className="w-6 h-6 mr-2 text-brand-primary" />
            Все игроки
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left">Игрок</th>
                  <th className="px-4 py-3 text-left">Клуб</th>
                  <th className="px-4 py-3 text-left">Позиция</th>
                  <th className="px-4 py-3 text-center">Голы</th>
                  <th className="px-4 py-3 text-center">Ассисты</th>
                  <th className="px-4 py-3 text-center">🟨</th>
                  <th className="px-4 py-3 text-center">🟥</th>
                  <th className="px-4 py-3 text-center">Матчи</th>
                </tr>
              </thead>
              <tbody>
                {playersList.map((player) => (
                  <tr key={player.id} className="border-b border-white/10">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {(player as any).photo_url || player.photo ? (
                          <Image 
                            src={(player as any).photo_url || player.photo} 
                            alt={`${player.first_name} ${player.last_name}`} 
                            width={32} 
                            height={32} 
                            className="rounded-full object-contain bg-transparent"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs text-white/40 font-bold">
                            {player.first_name?.[0]}{player.last_name?.[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-medium text-white">
                            {player.first_name} {player.last_name}
                          </div>
                          {player.number && (
                            <div className="text-sm text-white/70">
                              №{player.number}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {(player as any).club_logo && (
                          <Image 
                            src={(player as any).club_logo} 
                            alt={`Логотип ${(player as any).club_name || 'клуба'}`}
                            width={24} 
                            height={24} 
                            className="rounded object-cover"
                          />
                        )}
                        <span className="text-white">
                          {(player as any).club_name || 'Без клуба'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white/70">
                      {player.position || 'Не указана'}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-brand-primary">
                      {player.goals_scored || 0}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-brand-primary">
                      {player.assists || 0}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-yellow-400">
                      {(player as any).yellow_cards || 0}
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-red-400">
                      {(player as any).red_cards || 0}
                    </td>
                    <td className="px-4 py-3 text-center text-white/70">
                      {player.games_played || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}


