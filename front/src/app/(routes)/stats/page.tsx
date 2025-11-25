"use client"
import { useEffect, useMemo, useState } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Loading } from '@/components/Loading'
import { usePlayers } from '@/hooks/usePlayers'
import Image from 'next/image'
import { Trophy, Target, Users, Award } from 'lucide-react'
import { getImageUrl } from '@/utils'
import { SeasonFilter } from '@/components/SeasonFilter'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PaginationControls } from '@/components/admin/PaginationControls'

const ITEMS_PER_PAGE = 6

const positionMap: { [key: string]: string } = {
  goalkeeper: 'Вратарь',
  defender: 'Защитник',
  midfielder: 'Полузащитник',
  forward: 'Нападающий',
  GK: 'Вратарь',
  DF: 'Защитник',
  MF: 'Полузащитник',
  FW: 'Нападающий',
};

export default function StatsPage() {
  const { players, loading, error, refetch } = usePlayers()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  
  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      const refreshTypes = ['match', 'player', 'player_stats', 'club', 'transfer']
      if (refreshTypes.includes(event.detail.type)) {
        refetch()
        setCurrentPage(1)
      }
    }

    window.addEventListener('data-refresh', handleDataRefresh as EventListener)
    return () => {
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener)
    }
  }, [refetch])

  // Обрабатываем данные до условных return (исправляем ошибку с хуками)
  const playersList = useMemo(() => Array.isArray(players) ? players : [], [players])
  const hasNoPlayers = playersList.length === 0

  // Сортируем игроков по голам
  const topScorers = useMemo(() => {
    return [...playersList]
      .filter(player => (player.goals_scored || 0) > 0)
      .sort((a, b) => (b.goals_scored || 0) - (a.goals_scored || 0))
      .slice(0, 10)
  }, [playersList])

  // Сортируем игроков по ассистам (если есть)
  const topAssisters = useMemo(() => {
    return [...playersList]
      .filter(player => (player.assists || 0) > 0)
      .sort((a, b) => (b.assists || 0) - (a.assists || 0))
      .slice(0, 10)
  }, [playersList])

  // Пагинация для таблицы всех игроков
  const totalPlayers = playersList.length
  const totalPages = Math.max(1, Math.ceil(totalPlayers / ITEMS_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const paginatedPlayers = useMemo(() => {
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE
    return playersList.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [playersList, safePage])

  useEffect(() => {
    if (currentPage !== safePage) {
      setCurrentPage(safePage)
    }
  }, [currentPage, safePage])

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

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Статистика' }]} />
        <h1 className="text-3xl font-bold text-center mb-8">Статистика игроков</h1>
        <div className="mb-6">
          <SeasonFilter />
        </div>
        
        {hasNoPlayers ? (
          <div className="card p-6">
            <div className="text-center py-16">
              <div className="w-40 h-40 bg-brand-primary/20 rounded-full mb-4 flex items-center justify-center mx-auto">
                <Trophy className="w-10 h-10 text-brand-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Статистика не найдена</h3>
              <p className="text-white/70">Статистика игроков будет доступна после начала сезона для выбранного сезона</p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Scorers */}
          <div className="card p-6">
            <h2 className="text-2xl font-bold text-white mb-6">Лучшие бомбардиры</h2>
            
            {topScorers.length > 0 ? (
              <div className="space-y-4">
                {topScorers.map((player, index) => (
                  <div 
                    key={player.id} 
                    className="flex items-center gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                    onClick={() => router.push(`/players/${player.id}`)}
                  >
                    <div className="w-8 h-8 bg-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary font-bold">
                      {index + 1}
                    </div>
                    
                    <div className="w-12 h-12 relative overflow-hidden rounded-full">
                      {player.photo ? (
                        <Image 
                          src={getImageUrl(player.photo)} 
                          alt={`${player.first_name} ${player.last_name}`} 
                          width={48} 
                          height={48} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center">
                          <Image
                            src="/images/player-silhouette.png"
                            alt="Player silhouette"
                            width={48}
                            height={48}
                            className="opacity-70 object-contain"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {player.first_name} {player.last_name}
                      </div>
                      <div className="text-sm text-white/70">
                        {(player as any).club_name || player.club?.name || 'Без клуба'}
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
            <h2 className="text-2xl font-bold text-white mb-6">Лучшие ассистенты</h2>
            
            {topAssisters.length > 0 ? (
              <div className="space-y-4">
                {topAssisters.map((player, index) => (
                  <div 
                    key={player.id} 
                    className="flex items-center gap-4 p-3 bg-white/5 rounded-lg hover:bg-white/10 cursor-pointer transition-colors"
                    onClick={() => router.push(`/players/${player.id}`)}
                  >
                    <div className="w-8 h-8 bg-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary font-bold">
                      {index + 1}
                    </div>
                    
                    <div className="w-12 h-12 relative overflow-hidden rounded-full">
                      {player.photo ? (
                        <Image 
                          src={getImageUrl(player.photo)} 
                          alt={`${player.first_name} ${player.last_name}`} 
                          width={48} 
                          height={48} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full flex items-center justify-center">
                          <Image
                            src="/images/player-silhouette.png"
                            alt="Player silhouette"
                            width={48}
                            height={48}
                            className="opacity-70 object-contain"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="font-semibold text-white">
                        {player.first_name} {player.last_name}
                      </div>
                      <div className="text-sm text-white/70">
                        {(player as any).club_name || player.club?.name || 'Без клуба'}
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
          <h2 className="text-2xl font-bold text-white mb-6">Все игроки</h2>
          
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
                {paginatedPlayers.map((player) => (
                  <tr 
                    key={player.id} 
                    className="border-b border-white/10 hover:bg-white/10 cursor-pointer transition-colors"
                    onClick={() => router.push(`/players/${player.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {player.photo ? (
                          <Image 
                            src={getImageUrl(player.photo)} 
                            alt={`${player.first_name} ${player.last_name}`} 
                            width={48} 
                            height={48} 
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                            <Image
                              src="/images/player-silhouette.png"
                              alt="Player silhouette"
                              width={48}
                              height={48}
                              className="opacity-70 object-contain"
                            />
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
                            src={getImageUrl((player as any).club_logo)} 
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
                      {player.position ? (positionMap[player.position] || player.position) : 'Не указана'}
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
                      {(player as any).matches_played || (player as any).games_played || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {totalPlayers > ITEMS_PER_PAGE && (
            <div className="px-6 py-4 border-t border-white/10">
              <PaginationControls
                page={safePage}
                pageSize={ITEMS_PER_PAGE}
                totalItems={totalPlayers}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  )
}


