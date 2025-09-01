"use client"
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Loading } from '@/components/Loading'
import { useMatches } from '@/hooks/useMatches'
import { formatDate } from '@/utils'
import Image from 'next/image'
import Link from 'next/link'
import { Calendar, MapPin, Clock } from 'lucide-react'

export default function SchedulePage() {
  const { matches, loading, error } = useMatches()

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
          <Breadcrumbs items={[{ label: 'Расписание' }]} />
          <h1 className="text-3xl font-bold text-center">Расписание матчей</h1>
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
          <Breadcrumbs items={[{ label: 'Расписание' }]} />
          <h1 className="text-3xl font-bold text-center">Расписание матчей</h1>
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-brand-primary/20 rounded-full mb-4 flex items-center justify-center mx-auto">
              <Calendar className="w-10 h-10 text-brand-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Матчи не найдены</h3>
            <p className="text-white/70">Расписание матчей будет доступно позже</p>
          </div>
        </div>
      </div>
    )
  }

  // Группируем матчи по дате
  const matchesByDate = matchesList.reduce((acc: { [key: string]: any[] }, match) => {
    const date = match.date ? formatDate(match.date) : 'Дата не указана'
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(match)
    return acc
  }, {})

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Расписание' }]} />
        <h1 className="text-3xl font-bold text-center mb-8">Расписание матчей</h1>
        
        <div className="space-y-8">
          {Object.entries(matchesByDate).map(([date, dayMatches]) => (
            <div key={date}>
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-brand-primary" />
                {date}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dayMatches.map((match) => {
                  const isFinished = match.status === 'finished'
                  const isLive = match.status === 'live'
                  
                  return (
                    <div key={match.id} className="card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-white/70 text-sm">
                          {match.time && (
                            <div className="flex items-center mr-4">
                              <Clock className="w-4 h-4 mr-1" />
                              {match.time}
                            </div>
                          )}
                          {match.stadium && (
                            <div className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {match.stadium}
                            </div>
                          )}
                        </div>
                        
                        <div className={`px-2 py-1 rounded text-xs ${
                          isFinished ? 'bg-green-500/20 text-green-400' :
                          isLive ? 'bg-red-500/20 text-red-400' :
                          match.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {isFinished ? 'Завершен' :
                           isLive ? 'В прямом эфире' :
                           match.status === 'cancelled' ? 'Отменен' :
                           'Запланирован'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 items-center gap-4 text-center">
                        {/* Home Team */}
                        <div>
                          {match.home_team?.logo ? (
                            <Image 
                              src={match.home_team.logo.startsWith('http') ? match.home_team.logo : `/${match.home_team.logo}`} 
                              alt={match.home_team?.name || 'Команда'} 
                              width={48} 
                              height={48} 
                              className="mx-auto mb-2 rounded"
                            />
                          ) : (
                            <div className="mx-auto mb-2 w-12 h-12 bg-white/10 rounded flex items-center justify-center text-lg text-white/40 font-bold">
                              {match.home_team?.name?.[0] || 'К'}
                            </div>
                          )}
                          <div className="font-medium text-white text-sm">
                            {match.home_team?.name || 'Неизвестная команда'}
                          </div>
                        </div>
                        
                        {/* Score */}
                        <div>
                          {isFinished ? (
                            <div className="text-2xl font-bold text-white">
                              {match.home_score ?? 0} : {match.away_score ?? 0}
                            </div>
                          ) : isLive ? (
                            <div className="text-xl font-bold text-red-400">
                              LIVE
                            </div>
                          ) : (
                            <div className="text-xl font-bold text-white/60">
                              VS
                            </div>
                          )}
                        </div>
                        
                        {/* Away Team */}
                        <div>
                          {match.away_team?.logo ? (
                            <Image 
                              src={match.away_team.logo.startsWith('http') ? match.away_team.logo : `/${match.away_team.logo}`} 
                              alt={match.away_team?.name || 'Команда'} 
                              width={48} 
                              height={48} 
                              className="mx-auto mb-2 rounded"
                            />
                          ) : (
                            <div className="mx-auto mb-2 w-12 h-12 bg-white/10 rounded flex items-center justify-center text-lg text-white/40 font-bold">
                              {match.away_team?.name?.[0] || 'К'}
                            </div>
                          )}
                          <div className="font-medium text-white text-sm">
                            {match.away_team?.name || 'Неизвестная команда'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex justify-center">
                        <Link 
                          href={`/matches/${match.id}`} 
                          className="btn btn-outline px-4 py-2 text-sm"
                        >
                          Подробнее
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


