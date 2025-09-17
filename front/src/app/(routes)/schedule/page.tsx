"use client"
import { useEffect } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Loading } from '@/components/Loading'
import { useMatches } from '@/hooks/useMatches'
import { formatDate } from '@/utils'
import Image from 'next/image'
import { Calendar, MapPin, Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { SeasonFilter } from '@/components/SeasonFilter'

export default function SchedulePage() {
  const { matches, loading, error, refetch } = useMatches()
  const router = useRouter()
  
  const handleTeamClick = (teamId: number) => {
    router.push(`/clubs/${teamId}`)
  }
  
  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      const refreshTypes = ['match', 'club', 'stadium', 'season']
      if (refreshTypes.includes(event.detail.type)) {
        console.log('Обновляем расписание...', event.detail.type)
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
          <Breadcrumbs items={[{ label: 'Расписание' }]} />
          <h1 className="text-3xl font-bold text-center">Расписание матчей</h1>
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
          <Breadcrumbs items={[{ label: 'Матчи' }]} />
          <h1 className="text-3xl font-bold text-center">Матчи</h1>
          <div className="text-center text-red-400 mt-8">
            Ошибка загрузки данных: {typeof error === 'string' ? error : 'Неизвестная ошибка'}
          </div>
        </div>
      </div>
    )
  }

  const matchesList = Array.isArray(matches) ? matches : []

  if (matchesList.length === 0) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs items={[{ label: 'Матчи' }]} />
          <h1 className="text-3xl font-bold text-center">Матчи</h1>
          <div className="text-center py-16">
            <div className="w-40 h-40 bg-brand-primary/20 rounded-full mb-4 flex items-center justify-center mx-auto">
              <Calendar className="w-10 h-10 text-brand-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Матчи не найдены</h3>
            <p className="text-white/70">Расписание матчей пока не доступно</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Расписание' }]} />
        <h1 className="text-3xl font-bold text-center mb-8">Расписание матчей</h1>
        <div className="mb-6">
          <SeasonFilter />
        </div>
        
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="bg-gradient-to-r from-brand-primary/20 to-brand-primary/10 px-6 py-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white">Матчи сезона</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-6 py-4 text-left text-white font-medium">#</th>
                  <th className="px-6 py-4 text-left text-white font-medium">Дата</th>
                  <th className="px-6 py-4 text-left text-white font-medium">Хозяева</th>
                  <th className="px-6 py-4 text-center text-white font-medium">Счёт</th>
                  <th className="px-6 py-4 text-left text-white font-medium">Гости</th>
                  <th className="px-6 py-4 text-left text-white font-medium">Стадион</th>
                  <th className="px-6 py-4 text-left text-white font-medium">Статус</th>
                </tr>
              </thead>
              <tbody>
                {matchesList.map((match, index) => {
                  const isFinished = match.status === 'finished'
                  const isLive = match.status === 'live'
                  
                  return (
                    <tr 
                      key={match.id} 
                      className="border-b border-white/10 hover:bg-white/5 transition-all duration-300 cursor-pointer group"
                      onClick={() => router.push(`/matches/${match.id}`)}
                    >
                      <td className="px-6 py-4 text-white/70 font-medium">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-white">
                          {match.date ? formatDate(match.date) : 'TBD'}
                        </div>
                        {match.time && (
                          <div className="text-sm text-white/60 flex items-center mt-1">
                            <Clock className="w-3 h-3 mr-1" />
                            {match.time}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div 
                          className="flex items-center cursor-pointer hover:text-brand-primary transition-colors"
                          onClick={() => handleTeamClick(match.home_team_id)}
                        >
                          {match.home_team_logo ? (
                            <div className="w-7 h-7 rounded-full overflow-hidden mr-3 border border-white/20">
                              <Image
                                src={match.home_team_logo}
                                alt={`${match.home_team_name} logo`}
                                width={28}
                                height={28}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-7 h-7 bg-white/10 rounded-full mr-3 border border-white/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-white/60">
                                {match.home_team_name?.[0] || 'К'}
                              </span>
                            </div>
                          )}
                          <span className="font-medium text-white">
                            {match.home_team_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        {isFinished || isLive ? (
                          <div className="inline-flex items-center gap-2">
                            <span className="text-lg font-bold text-white bg-white/10 px-3 py-1 rounded">
                              {match.home_score} : {match.away_score}
                            </span>
                            {isLive && (
                              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                          </div>
                        ) : (
                          <span className="text-white/50">vs</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div 
                          className="flex items-center cursor-pointer hover:text-brand-primary transition-colors"
                          onClick={() => handleTeamClick(match.away_team_id)}
                        >
                          {match.away_team_logo ? (
                            <div className="w-7 h-7 rounded-full overflow-hidden mr-3 border border-white/20">
                              <Image
                                src={match.away_team_logo}
                                alt={`${match.away_team_name} logo`}
                                width={28}
                                height={28}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-7 h-7 bg-white/10 rounded-full mr-3 border border-white/20 flex items-center justify-center">
                              <span className="text-xs font-bold text-white/60">
                                {match.away_team_name?.[0] || 'К'}
                              </span>
                            </div>
                          )}
                          <span className="font-medium text-white">
                            {match.away_team_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {((match as any).stadium_name || (match as any).stadium_ref?.name || match.stadium) && (
                          <div className="flex items-center text-white/70">
                            <MapPin className="w-4 h-4 mr-2 text-brand-primary" />
                            <span className="text-sm">{(match as any).stadium_name || (match as any).stadium_ref?.name || match.stadium}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          isLive ? 'bg-red-500/20 text-red-400' :
                          isFinished ? 'bg-green-500/20 text-green-400' :
                          match.status === 'scheduled' ? 'bg-blue-500/20 text-blue-400' :
                          match.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {match.status === 'live' ? 'Прямой эфир' :
                           match.status === 'finished' ? 'Завершен' :
                           match.status === 'scheduled' ? 'Запланирован' :
                           match.status === 'cancelled' ? 'Отменен' :
                           match.status === 'postponed' ? 'Перенесен' :
                           match.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}