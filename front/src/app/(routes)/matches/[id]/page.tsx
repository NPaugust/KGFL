"use client"
import { useParams } from 'next/navigation'
import { useMatch } from '@/hooks/useMatches'
import { Loading } from '@/components/Loading'
import { formatDate } from '@/utils'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, MapPin, Clock, Users } from 'lucide-react'
import { useApi } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'

export default function MatchDetailsPage() {
  const params = useParams()
  const matchId = params.id as string
  const { match, loading, error } = useMatch(matchId)

  // Загружаем события матча
  const { data: goalsData } = useApi<any[]>(API_ENDPOINTS.GOALS, { match: matchId }, [matchId])
  const { data: cardsData } = useApi<any[]>(API_ENDPOINTS.CARDS, { match: matchId }, [matchId])
  const { data: subsData } = useApi<any[]>(API_ENDPOINTS.SUBSTITUTIONS, { match: matchId }, [matchId])

  const goals = Array.isArray(goalsData) ? goalsData : []
  const cards = Array.isArray(cardsData) ? cardsData : []
  const substitutions = Array.isArray(subsData) ? subsData : []

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <Loading />
      </div>
    )
  }

  if (error || !match) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Матч не найден</h1>
          <p className="text-white/70 mb-6">Запрашиваемый матч не существует или был удален</p>
          <Link href="/" className="btn btn-primary">
            На главную
          </Link>
        </div>
      </div>
    )
  }

  const isFinished = match.status === 'finished'
  const isLive = match.status === 'live'

  // Подсчёты по командам
  const homeId = (match.home_team as any)?.id
  const awayId = (match.away_team as any)?.id
  const goalsHome = goals.filter(g => (g.team?.id ?? g.team) === homeId).length
  const goalsAway = goals.filter(g => (g.team?.id ?? g.team) === awayId).length
  const ycHome = cards.filter(c => c.card_type === 'yellow' && ((c.team?.id ?? c.team) === homeId)).length
  const ycAway = cards.filter(c => c.card_type === 'yellow' && ((c.team?.id ?? c.team) === awayId)).length
  const rcHome = cards.filter(c => c.card_type === 'red' && ((c.team?.id ?? c.team) === homeId)).length
  const rcAway = cards.filter(c => c.card_type === 'red' && ((c.team?.id ?? c.team) === awayId)).length

  // Лента событий по минутам
  const timeline: Array<{ minute: number; type: 'goal' | 'yellow' | 'red' | 'sub'; side: 'home'|'away'; text: string }> = []
  goals.forEach(g => {
    const minute = Number(g.minute) || 0
    const side = ((g.team?.id ?? g.team) === homeId) ? 'home' : 'away'
    const scorer = g.scorer_full_name || g.scorer_name || g.scorer || 'Игрок'
    const assist = g.assist_full_name || g.assist_name
    const text = assist ? `${scorer} (ассист: ${assist})` : `${scorer}`
    timeline.push({ minute, type: 'goal', side, text })
  })
  cards.forEach(c => {
    const minute = Number(c.minute) || 0
    const side = ((c.team?.id ?? c.team) === homeId) ? 'home' : 'away'
    const player = c.player_full_name || c.player_name || c.player || 'Игрок'
    timeline.push({ minute, type: c.card_type === 'red' ? 'red' : 'yellow', side, text: player })
  })
  substitutions.forEach(s => {
    const minute = Number(s.minute) || 0
    const side = ((s.team?.id ?? s.team) === homeId) ? 'home' : 'away'
    const outName = s.player_out_name || s.player_out_full_name || s.player_out || 'Игрок'
    const inName = s.player_in_name || s.player_in_full_name || s.player_in || 'Игрок'
    timeline.push({ minute, type: 'sub', side, text: `${outName} → ${inName}` })
  })
  timeline.sort((a, b) => a.minute - b.minute)

  return (
    <div className="min-h-screen bg-brand-dark">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-dark to-brand-primary/20 py-8">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-flex items-center text-white/70 hover:text-white mb-6">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Назад на главную
          </Link>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              {match.date && (
                <div className="flex items-center text-white/70">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDate(match.date)}
                </div>
              )}
              {match.stadium && (
                <div className="flex items-center text-white/70">
                  <MapPin className="w-4 h-4 mr-1" />
                  {match.stadium}
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-center gap-8 lg:gap-16">
              {/* Home Team */}
              <div className="text-center">
                <div className="w-20 h-20 lg:w-32 lg:h-32 mx-auto mb-4">
                  {match.home_team?.logo ? (
                    <Image 
                      src={match.home_team.logo.startsWith('http') ? match.home_team.logo : `/${match.home_team.logo}`} 
                      alt={match.home_team?.name || 'Команда'} 
                      width={128} 
                      height={128} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 rounded flex items-center justify-center text-3xl lg:text-5xl text-white/40 font-bold">
                      {match.home_team?.name?.[0] || 'К'}
                    </div>
                  )}
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-white">
                  {match.home_team?.name || 'Неизвестная команда'}
                </h2>
              </div>
              
              {/* Score */}
              <div className="text-center">
                {isFinished ? (
                  <div className="text-4xl lg:text-6xl font-bold text-white">
                    {match.home_score ?? 0} : {match.away_score ?? 0}
                  </div>
                ) : isLive ? (
                  <div className="text-2xl lg:text-4xl font-bold text-red-400">
                    LIVE
                  </div>
                ) : (
                  <div className="text-2xl lg:text-4xl font-bold text-white/60">
                    VS
                  </div>
                )}
                <div className="mt-2 text-sm text-white/70">
                  {match.status === 'finished' ? 'Завершен' :
                   match.status === 'live' ? 'В прямом эфире' :
                   match.status === 'cancelled' ? 'Отменен' :
                   'Запланирован'}
                </div>
              </div>
              
              {/* Away Team */}
              <div className="text-center">
                <div className="w-20 h-20 lg:w-32 lg:h-32 mx-auto mb-4">
                  {match.away_team?.logo ? (
                    <Image 
                      src={match.away_team.logo.startsWith('http') ? match.away_team.logo : `/${match.away_team.logo}`} 
                      alt={match.away_team?.name || 'Команда'} 
                      width={128} 
                      height={128} 
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 rounded flex items-center justify-center text-3xl lg:text-5xl text-white/40 font-bold">
                      {match.away_team?.name?.[0] || 'К'}
                    </div>
                  )}
                </div>
                <h2 className="text-xl lg:text-2xl font-bold text-white">
                  {match.away_team?.name || 'Неизвестная команда'}
                </h2>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Match Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Match Info */}
          <div className="card p-6">
            <h3 className="text-xl font-bold text-white mb-4">Информация о матче</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/70">Дата:</span>
                <span className="text-white">{match.date ? formatDate(match.date) : 'Не указана'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Время:</span>
                <span className="text-white">{match.time || 'Не указано'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Стадион:</span>
                <span className="text-white">{match.stadium || 'Не указан'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/70">Статус:</span>
                <span className="text-white">
                  {match.status === 'finished' ? 'Завершен' :
                   match.status === 'live' ? 'В прямом эфире' :
                   match.status === 'cancelled' ? 'Отменен' :
                   'Запланирован'}
                </span>
              </div>
              {match.round && (
                <div className="flex justify-between">
                  <span className="text-white/70">Тур:</span>
                  <span className="text-white">{match.round}</span>
                </div>
              )}
            </div>
          </div>
          
          {/* Teams Info */}
          <div className="card p-6">
            <h3 className="text-xl font-bold text-white mb-4">Команды</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {match.home_team?.logo ? (
                  <Image 
                    src={match.home_team.logo.startsWith('http') ? match.home_team.logo : `/${match.home_team.logo}`} 
                    alt={match.home_team?.name || 'Команда'} 
                    width={40} 
                    height={40} 
                    className="rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-sm text-white/40 font-bold">
                    {match.home_team?.name?.[0] || 'К'}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-white">{match.home_team?.name}</div>
                  <div className="text-sm text-white/70">Домашняя команда</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {match.away_team?.logo ? (
                  <Image 
                    src={match.away_team.logo.startsWith('http') ? match.away_team.logo : `/${match.away_team.logo}`} 
                    alt={match.away_team?.name || 'Команда'} 
                    width={40} 
                    height={40} 
                    className="rounded"
                  />
                ) : (
                  <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-sm text-white/40 font-bold">
                    {match.away_team?.name?.[0] || 'К'}
                  </div>
                )}
                <div>
                  <div className="font-semibold text-white">{match.away_team?.name}</div>
                  <div className="text-sm text-white/70">Гостевая команда</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Statistics */}
        <div className="mt-8 card p-6">
          <h3 className="text-xl font-bold text-white mb-4">Статистика матча</h3>
          {timeline.length === 0 ? (
            <div className="text-center text-white/70 py-8">События матча отсутствуют</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Лента событий */}
              <div className="lg:col-span-2">
                <div className="space-y-3">
                  {timeline.map((ev, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-white">
                      <div className="w-10 text-right text-white/70">{ev.minute}&apos;</div>
                      <div className={ev.side === 'home' ? 'text-brand-accent' : 'text-white'}>
                        {ev.type === 'goal' ? '⚽ Гол' : ev.type === 'yellow' ? '🟨 Карточка' : ev.type === 'red' ? '🟥 Карточка' : '🔁 Замена'}
                      </div>
                      <div className="flex-1 text-white/90">{ev.text}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Сводка по командам */}
              <div className="bg-white/5 rounded p-4">
                <div className="text-white/80 mb-4 font-semibold">Сводка</div>
                <div className="grid grid-cols-3 gap-3 text-center text-white">
                  <div></div>
                  <div className="text-white/60">Дом</div>
                  <div className="text-white/60">Гости</div>
                  <div className="text-white/80">Голы</div>
                  <div className="font-bold">{goalsHome}</div>
                  <div className="font-bold">{goalsAway}</div>
                  <div className="text-white/80">Жёлтые</div>
                  <div>{ycHome}</div>
                  <div>{ycAway}</div>
                  <div className="text-white/80">Красные</div>
                  <div>{rcHome}</div>
                  <div>{rcAway}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 