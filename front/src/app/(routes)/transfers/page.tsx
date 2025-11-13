"use client"
import { useEffect, useMemo, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Loading } from '@/components/Loading'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { getImageUrl } from '@/utils'
import { formatDate } from '@/utils'
import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'

export default function TransfersPage() {
  const { data: allTransfers, loading, error, refetch } = useApi<any[]>(API_ENDPOINTS.PLAYER_TRANSFERS)
  const { data: seasons } = useApi<any[]>(API_ENDPOINTS.SEASONS)
  const [expandedSeasons, setExpandedSeasons] = useState<Set<string>>(new Set())

  // Группируем трансферы по сезонам
  const transfersBySeason = useMemo(() => {
    if (!allTransfers || !seasons) return {};
    
    const grouped: { [seasonId: string]: { season: any, transfers: any[] } } = {};
    
    // Создаем группы для каждого сезона
    seasons.forEach(season => {
      grouped[season.id] = {
        season,
        transfers: []
      };
    });
    
    // Распределяем трансферы по сезонам
    allTransfers.forEach(transfer => {
      const seasonId = transfer.season?.toString() || 'unknown';
      if (grouped[seasonId]) {
        grouped[seasonId].transfers.push(transfer);
      }
    });
    
    return grouped;
  }, [allTransfers, seasons]);

  const toggleSeason = (seasonId: string) => {
    const newExpanded = new Set(expandedSeasons);
    if (newExpanded.has(seasonId)) {
      newExpanded.delete(seasonId);
    } else {
      newExpanded.add(seasonId);
    }
    setExpandedSeasons(newExpanded);
  };
  
  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      const refreshTypes = ['transfer', 'player', 'club']
      if (refreshTypes.includes(event.detail.type)) {
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
      <main className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Трансферы' }]} />
        <h1 className="text-3xl font-bold text-center">Трансферы игроков</h1>
        <div className="mt-6 flex justify-center">
          <Loading />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Трансферы' }]} />
        <h1 className="text-3xl font-bold text-center">Трансферы игроков</h1>
        <div className="mt-6 text-center text-red-400">
          Ошибка загрузки данных
        </div>
      </main>
    )
  }

  return (
    <main className="container-px py-10">
      <Breadcrumbs items={[{ label: 'Трансферы' }]} />
      <h1 className="text-3xl font-bold text-center mb-8">Трансферы игроков</h1>

      {Object.keys(transfersBySeason).length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-brand-primary/20 rounded-full mb-4 flex items-center justify-center mx-auto">
            <span className="text-brand-primary font-bold text-3xl">Т</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Трансферы не найдены</h3>
          <p className="text-white/70">Информация о трансферах будет доступна позже</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(transfersBySeason).map(([seasonId, { season, transfers }]) => (
            <motion.div
              key={seasonId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
            >
              <div 
                className="flex items-center justify-between p-6 cursor-pointer hover:bg-white/10 transition-colors"
                onClick={() => toggleSeason(seasonId)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-brand-primary font-bold text-lg">
                      {transfers.length}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{season.name}</h3>
                    <p className="text-sm text-white/60">
                      {transfers.length} трансфер{transfers.length === 1 ? '' : transfers.length < 5 ? 'а' : 'ов'}
                    </p>
                  </div>
                </div>
                {expandedSeasons.has(seasonId) ? (
                  <ChevronDown className="w-6 h-6 text-white/60" />
                ) : (
                  <ChevronRight className="w-6 h-6 text-white/60" />
                )}
              </div>
              
              {expandedSeasons.has(seasonId) && (
                <div className="border-t border-white/10 p-6">
                  {transfers.length > 0 ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {transfers.map((transfer, index) => (
                        <motion.div
                          key={transfer.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                            {/* Фото игрока */}
                            <div className="flex justify-center mb-4">
                              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-white/20">
                                {transfer.player?.photo ? (
                                  <Image 
                                    src={getImageUrl(transfer.player.photo)} 
                                    alt={`${transfer.player?.first_name || ''} ${transfer.player?.last_name || ''}`} 
                                    width={80} 
                                    height={80} 
                                    className="w-full h-full object-cover" 
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Image
                                      src="/images/player-silhouette.png"
                                      alt="Player silhouette"
                                      width={80}
                                      height={80}
                                      className="opacity-70 object-contain"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Информация о трансфере */}
                            <div className="text-center">
                              <h3 className="text-lg font-bold text-white mb-2">
                                {transfer.player_full_name || `${transfer.player?.first_name || ''} ${transfer.player?.last_name || ''}` || 'Игрок'}
                              </h3>
                              
                              {/* Позиция игрока */}
                              {transfer.player?.position && (
                                <p className="text-brand-primary mb-3 text-sm">{transfer.player.position}</p>
                              )}

                              {/* Клубы */}
                              <div className="space-y-3 mb-4">
                                {/* Из клуба */}
                                <div className="flex items-center justify-center gap-3">
                                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                                    {transfer.from_club?.logo ? (
                                      <Image 
                                        src={getImageUrl(transfer.from_club.logo)} 
                                        alt={transfer.from_club.name} 
                                        width={32} 
                                        height={32} 
                                        className="w-full h-full object-cover" 
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                        <span className="text-white/60 text-xs font-bold">
                                          {transfer.from_club?.name?.[0] || 'К'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-white/80 text-sm">
                                    {transfer.from_club?.name || 'Свободный агент'}
                                  </span>
                                </div>

                                {/* Стрелка */}
                                <div className="flex justify-center">
                                  <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center">
                                    <span className="text-brand-primary text-sm">→</span>
                                  </div>
                                </div>

                                {/* В клуб */}
                                <div className="flex items-center justify-center gap-3">
                                  <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20">
                                    {transfer.to_club?.logo ? (
                                      <Image 
                                        src={getImageUrl(transfer.to_club.logo)} 
                                        alt={transfer.to_club.name} 
                                        width={32} 
                                        height={32} 
                                        className="w-full h-full object-cover" 
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-white/10 flex items-center justify-center">
                                        <span className="text-white/60 text-xs font-bold">
                                          {transfer.to_club?.name?.[0] || 'К'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  <span className="text-white/80 text-sm">
                                    {transfer.to_club?.name || '-'}
                                  </span>
                                </div>
                              </div>

                              {/* Дополнительная информация */}
                              <div className="space-y-2 text-sm">
                                {transfer.transfer_date && (
                                  <div className="flex justify-between text-white/60">
                                    <span>Дата:</span>
                                    <span className="text-white/80">{formatDate(transfer.transfer_date)}</span>
                                  </div>
                                )}
                                {transfer.transfer_fee && (
                                  <div className="flex justify-between text-white/60">
                                    <span>Сумма:</span>
                                    <span className="text-white/80">{transfer.transfer_fee} Сом </span>
                                  </div>
                                )}
                              </div>

                              {/* Статус трансфера */}
                              <div className="mt-4">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                                  transfer.status === 'confirmed' 
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                    : transfer.status === 'pending'
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                }`}>
                                  {transfer.status === 'confirmed' ? 'Подтверждён' : 
                                   transfer.status === 'pending' ? 'Ожидание' : 
                                   'Отменён'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-white/60">
                      <p>В этом сезоне трансферов не было</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="btn btn-outline">На главную</Link>
      </div>
    </main>
  )
}


