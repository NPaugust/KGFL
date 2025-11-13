"use client"
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePlayer } from '@/hooks/usePlayers'
import { useApi } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { SeasonFilter } from '@/components/SeasonFilter'
import { useSeasonStore } from '@/store/useSeasonStore'
import Image from 'next/image'
import Link from 'next/link'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Loading } from '@/components/Loading'
import { getImageUrl, formatDate } from '@/utils'
import { Trophy, Target, Calendar, TrendingUp, Award, Users, ArrowLeft } from 'lucide-react'

// Функция для определения предыдущей страницы из sessionStorage
function getPreviousPage(): { label: string; href: string } | null {
  if (typeof window === 'undefined') return null
  
  const referrer = document.referrer
  const lastPage = sessionStorage.getItem('lastPage')
  
  // Проверяем referrer
  if (referrer) {
    try {
      const url = new URL(referrer)
      const pathname = url.pathname
      
      if (pathname.includes('/matches/')) {
        return { label: 'Матчи', href: '/schedule' }
      } else if (pathname.includes('/clubs/')) {
        const clubId = pathname.split('/clubs/')[1]?.split('/')[0]
        if (clubId) {
          return { label: 'Клуб', href: `/clubs/${clubId}` }
        }
        return { label: 'Клубы', href: '/clubs' }
      } else if (pathname.includes('/stats') || pathname.includes('/table')) {
        return { label: 'Статистика', href: '/stats' }
      } else if (pathname === '/') {
        return { label: 'Главная', href: '/' }
      }
    } catch (e) {
      // Игнорируем ошибки парсинга URL
    }
  }
  
  // Проверяем sessionStorage
  if (lastPage) {
    try {
      const parsed = JSON.parse(lastPage)
      return parsed
    } catch (e) {
      // Игнорируем ошибки парсинга
    }
  }
  
  // По умолчанию возвращаем "Главная"
  return { label: 'Главная', href: '/' }
}

const positionMap: { [key: string]: string } = {
  goalkeeper: 'Вратарь',
  defender: 'Защитник',
  midfielder: 'Полузащитник',
  forward: 'Нападающий',
  GK: 'Вратарь',
  DF: 'Защитник',
  MF: 'Полузащитник',
  FW: 'Нападающий',
}

export default function PlayerDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { player, loading: playerLoading, error: playerError } = usePlayer(id)
  const { selectedSeasonId } = useSeasonStore()
  
  // Определяем предыдущую страницу для breadcrumbs
  const [breadcrumbItems, setBreadcrumbItems] = useState<Array<{ label: string; href?: string }>>([
    { label: 'Главная', href: '/' },
    { label: 'Игроки' }
  ])
  
  useEffect(() => {
    const prevPage = getPreviousPage()
    if (prevPage) {
      setBreadcrumbItems([
        { label: prevPage.label, href: prevPage.href },
        { label: player ? `${player.first_name} ${player.last_name}` : 'Игрок' }
      ])
    }
  }, [player])
  
  // Загружаем статистику игрока
  const statsUrl = player ? `${API_ENDPOINTS.PLAYER_STATS(id)}${selectedSeasonId ? `?season=${selectedSeasonId}` : ''}` : null
  const { data: statsData, loading: statsLoading } = useApi<any>(statsUrl, undefined, [id, selectedSeasonId])
  
  // Загружаем статистику по всем сезонам
  const { data: statsBySeasonData } = useApi<any[]>(API_ENDPOINTS.PLAYER_STATS_BY_SEASON(id), undefined, [id])
  const statsBySeason = Array.isArray(statsBySeasonData) ? statsBySeasonData : []
  
  // Загружаем историю матчей
  const matchesUrl = player ? `${API_ENDPOINTS.PLAYER_MATCHES(id)}${selectedSeasonId ? `?season=${selectedSeasonId}` : ''}` : null
  const { data: matchesData, loading: matchesLoading } = useApi<any[]>(matchesUrl, undefined, [id, selectedSeasonId])
  const matches = Array.isArray(matchesData) ? matchesData : []
  
  // Загружаем трансферы
  const { data: transfersData } = useApi<any[]>(API_ENDPOINTS.PLAYER_TRANSFERS, { player: id }, [id])
  const transfers = Array.isArray(transfersData) ? transfersData : []

  if (playerLoading) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="flex justify-center mt-8">
            <Loading />
          </div>
        </div>
      </div>
    )
  }

  if (playerError || !player) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="text-center text-red-400 mt-8">
            Игрок не найден
          </div>
        </div>
      </div>
    )
  }

  const stats = statsData || {
    matches_played: 0,
    matches_started: 0,
    minutes_played: 0,
    goals: 0,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
    clean_sheets: 0
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={breadcrumbItems} />
        
        {/* Кнопка назад */}
        {breadcrumbItems.length > 0 && breadcrumbItems[0].href && (
          <Link href={breadcrumbItems[0].href} className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Назад к {breadcrumbItems[0].label.toLowerCase()}
          </Link>
        )}

        {/* Заголовок и фильтр */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">{player.first_name} {player.last_name}</h1>
            <p className="text-white/70 text-lg">
              {player.position ? (positionMap[player.position] || player.position) : '—'} {player.number && `№${player.number}`}
              {player.club && ` • ${(player as any).club_name || player.club?.name || 'Без клуба'}`}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <SeasonFilter />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Левая колонка - Информация об игроке */}
          <div className="lg:col-span-1 space-y-6">
            {/* Фото и основная информация */}
            <div className="card p-6">
              <div className="flex flex-col items-center text-center mb-6">
                {player.photo ? (
                  <Image 
                    src={getImageUrl(player.photo)} 
                    alt={`${player.first_name} ${player.last_name}`} 
                    width={200} 
                    height={200} 
                    className="rounded-full object-cover mb-4 border-4 border-brand-primary/30"
                  />
                ) : (
                  <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center text-4xl mb-4 border-4 border-brand-primary/30">
                    {player.first_name?.[0]}{player.last_name?.[0]}
                  </div>
                )}
                <h2 className="text-2xl font-bold mb-2">{player.first_name} {player.last_name}</h2>
                <p className="text-white/70">{player.position ? (positionMap[player.position] || player.position) : '—'}</p>
                {player.number && (
                  <p className="text-brand-primary font-bold text-xl mt-2">№{player.number}</p>
                )}
              </div>
              
              <div className="space-y-4 border-t border-white/10 pt-4">
                {player.date_of_birth && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Дата рождения:</span>
                    <span className="text-white">{formatDate(player.date_of_birth)}</span>
                  </div>
                )}
                {player.nationality && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Гражданство:</span>
                    <span className="text-white">{player.nationality}</span>
                  </div>
                )}
                {player.height && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Рост:</span>
                    <span className="text-white">{player.height} см</span>
                  </div>
                )}
                {player.weight && (
                  <div className="flex justify-between">
                    <span className="text-white/70">Вес:</span>
                    <span className="text-white">{player.weight} кг</span>
                  </div>
                )}
                {player.club && (
                  <div className="flex justify-between items-center">
                    <span className="text-white/70">Клуб:</span>
                    <Link 
                      href={`/clubs/${player.club}`}
                      className="text-brand-primary hover:underline"
                    >
                      {(player as any).club_name || player.club?.name || 'Без клуба'}
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Статистика по сезонам */}
            {statsBySeason.length > 0 && (
              <div className="card p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Статистика по сезонам
                </h3>
                <div className="space-y-3">
                  {statsBySeason.map((seasonStat: any) => (
                    <div key={seasonStat.id} className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="font-semibold text-white mb-2">{seasonStat.season_name || 'Без сезона'}</div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-white/70">Голы:</span>
                          <span className="text-white ml-2 font-bold">{seasonStat.goals || 0}</span>
                        </div>
                        <div>
                          <span className="text-white/70">Ассисты:</span>
                          <span className="text-white ml-2 font-bold">{seasonStat.assists || 0}</span>
                        </div>
                        <div>
                          <span className="text-white/70">Матчи:</span>
                          <span className="text-white ml-2">{seasonStat.matches_played || 0}</span>
                        </div>
                        <div>
                          <span className="text-white/70">Минуты:</span>
                          <span className="text-white ml-2">{seasonStat.minutes_played || 0}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Правая колонка - Статистика и история */}
          <div className="lg:col-span-2 space-y-6">
            {/* Основная статистика */}
            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                Статистика {selectedSeasonId ? '(за выбранный сезон)' : '(за все сезоны)'}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-brand-primary mb-1">{stats.goals || 0}</div>
                  <div className="text-white/70 text-sm">Голы</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-1">{stats.assists || 0}</div>
                  <div className="text-white/70 text-sm">Ассисты</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-1">{stats.yellow_cards || 0}</div>
                  <div className="text-white/70 text-sm">Жёлтые</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-400 mb-1">{stats.red_cards || 0}</div>
                  <div className="text-white/70 text-sm">Красные</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">{stats.matches_played || 0}</div>
                  <div className="text-white/70 text-sm">Матчи</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">{stats.matches_started || 0}</div>
                  <div className="text-white/70 text-sm">В старте</div>
                </div>
                <div className="bg-white/5 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">{stats.minutes_played || 0}</div>
                  <div className="text-white/70 text-sm">Минуты</div>
                </div>
                {player.position === 'GK' ? (
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-green-400 mb-1">{stats.clean_sheets || 0}</div>
                    <div className="text-white/70 text-sm">Сухие</div>
                  </div>
                ) : (
                  <div className="bg-white/5 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-white mb-1">{(stats.goals || 0) + (stats.assists || 0)}</div>
                    <div className="text-white/70 text-sm">Г+П</div>
                  </div>
                )}
              </div>
            </div>

            {/* История матчей */}
            <div className="card p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                История матчей {selectedSeasonId ? '(за выбранный сезон)' : '(за все сезоны)'}
              </h2>
              {matchesLoading ? (
                <Loading />
              ) : matches.length === 0 ? (
                <div className="text-center text-white/70 py-8">
                  Матчи не найдены
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left">Дата</th>
                        <th className="px-4 py-3 text-left">Соперник</th>
                        <th className="px-4 py-3 text-center">Счёт</th>
                        <th className="px-4 py-3 text-center">Г</th>
                        <th className="px-4 py-3 text-center">А</th>
                        <th className="px-4 py-3 text-center">🟨</th>
                        <th className="px-4 py-3 text-center">🟥</th>
                        <th className="px-4 py-3 text-center">Результат</th>
                      </tr>
                    </thead>
                    <tbody>
                      {matches.map((match: any) => (
                        <tr 
                          key={match.id} 
                          className="border-b border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                          onClick={() => router.push(`/matches/${match.id}`)}
                        >
                          <td className="px-4 py-3">
                            <div className="text-white">{formatDate(match.date)}</div>
                            {match.time && (
                              <div className="text-white/60 text-sm">{match.time}</div>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-white">
                              {match.is_home ? 'vs' : '@'} {match.opponent?.name || 'Неизвестно'}
                            </div>
                            {match.season?.name && (
                              <div className="text-white/60 text-sm">{match.season.name}</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {match.home_score !== null && match.away_score !== null ? (
                              <span className="font-bold text-white">
                                {match.home_score} : {match.away_score}
                              </span>
                            ) : (
                              <span className="text-white/50">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {match.player_goals > 0 ? (
                              <span className="font-bold text-brand-primary">{match.player_goals}</span>
                            ) : (
                              <span className="text-white/40">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {match.player_assists > 0 ? (
                              <span className="font-bold text-blue-400">{match.player_assists}</span>
                            ) : (
                              <span className="text-white/40">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {match.player_yellow_cards > 0 ? (
                              <span className="font-bold text-yellow-400">{match.player_yellow_cards}</span>
                            ) : (
                              <span className="text-white/40">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {match.player_red_cards > 0 ? (
                              <span className="font-bold text-red-400">{match.player_red_cards}</span>
                            ) : (
                              <span className="text-white/40">0</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {match.result === 'win' ? (
                              <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm">П</span>
                            ) : match.result === 'draw' ? (
                              <span className="px-2 py-1 bg-gray-500/20 text-gray-400 rounded text-sm">Н</span>
                            ) : match.result === 'loss' ? (
                              <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded text-sm">П</span>
                            ) : (
                              <span className="text-white/40">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* История трансферов */}
            {transfers.length > 0 && (
              <div className="card p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Users className="w-6 h-6" />
                  История трансферов
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white/5">
                      <tr>
                        <th className="px-4 py-3 text-left">Дата</th>
                        <th className="px-4 py-3 text-left">Из</th>
                        <th className="px-4 py-3 text-left">В</th>
                        <th className="px-4 py-3 text-left">Позиция</th>
                        <th className="px-4 py-3 text-left">Статус</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transfers.map((t: any) => (
                        <tr key={t.id} className="border-b border-white/10">
                          <td className="px-4 py-3 text-white">{formatDate(t.transfer_date)}</td>
                          <td className="px-4 py-3 text-white">{t.from_club?.name || 'Свободный агент'}</td>
                          <td className="px-4 py-3 text-white">{t.to_club?.name || '-'}</td>
                          <td className="px-4 py-3 text-white/70">
                            {t.player?.position ? (positionMap[t.player.position] || t.player.position) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-sm ${
                              t.status === 'confirmed' ? 'bg-green-500/20 text-green-400' :
                              t.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {t.status === 'confirmed' ? 'Подтверждён' : t.status === 'pending' ? 'Ожидание' : 'Отменён'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
