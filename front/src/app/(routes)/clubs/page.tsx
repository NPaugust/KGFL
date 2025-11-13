"use client"
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useClubs } from '@/hooks/useClubs'
import { Loading } from '@/components/Loading'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { getImageUrl } from '@/utils'
import { motion } from 'framer-motion'
import { useSeasonStore } from '@/store/useSeasonStore'
import { SeasonFilter } from '@/components/SeasonFilter'
import { useApi } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Club } from '@/types'

export default function ClubsPage() {
  const { selectedSeasonId } = useSeasonStore()
  const { clubs, clubsLoading: loading, clubsError: error, refetchClubs } = useClubs()
  
  // Проверяем, выбран ли конкретный сезон (не пустая строка)
  const hasSeasonFilter = selectedSeasonId && selectedSeasonId.trim() !== ''
  
  // Загружаем клубы с фильтром по сезону только если сезон выбран
  const seasonUrl = hasSeasonFilter && selectedSeasonId 
    ? `${API_ENDPOINTS.CLUBS}?all=1&season=${selectedSeasonId}` 
    : null
  const { data: filteredClubsData, loading: filteredLoading } = useApi<any>(
    seasonUrl,
    undefined,
    [selectedSeasonId]
  )
  
  // Извлекаем массив клубов из ответа (может быть пагинированный ответ или массив)
  const filteredClubs = Array.isArray(filteredClubsData) 
    ? filteredClubsData 
    : (filteredClubsData?.results || filteredClubsData?.data || [])
  
  // Используем отфильтрованные клубы, если сезон выбран, иначе все клубы
  const clubsList = hasSeasonFilter ? (filteredClubs || []) : (Array.isArray(clubs) ? clubs : [])
  const isLoading = hasSeasonFilter ? filteredLoading : loading
  
  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      const refreshTypes = ['match', 'club', 'player', 'player_stats', 'transfer', 'season']
      if (refreshTypes.includes(event.detail.type)) {
        refetchClubs()
      }
    }

    window.addEventListener('data-refresh', handleDataRefresh as EventListener)
    return () => {
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener)
    }
  }, [refetchClubs])

  if (isLoading) {
    return (
      <main className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Клубы' }]} />
        <h1 className="text-3xl font-bold text-center">Команды лиги</h1>
        <div className="mt-6 flex justify-center">
          <Loading />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Клубы' }]} />
        <h1 className="text-3xl font-bold text-center">Команды лиги</h1>
        <div className="mt-6 text-center text-red-400">
          Ошибка загрузки данных
        </div>
      </main>
    )
  }

  return (
    <main className="container-px py-10">
      <Breadcrumbs items={[{ label: 'Клубы' }]} />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-center flex-1">Команды лиги</h1>
        <div className="ml-4">
          <SeasonFilter />
        </div>
      </div>
      {clubsList.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clubsList.map((club: Club, index: number) => (
            <motion.div
              key={club.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/clubs/${club.id}`} className="block">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                  {/* Логотип клуба */}
                  <div className="flex justify-center mb-4">
                    <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-white/10 bg-white/5 flex items-center justify-center">
                      {club.logo ? (
                        <Image 
                          src={getImageUrl(club.logo)} 
                          alt={club.name} 
                          width={160} 
                          height={160} 
                          className="w-full h-full object-contain" 
                        />
                      ) : (
                        <span className="text-white font-bold text-2xl">
                          {club.name?.[0] || 'К'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Информация о клубе */}
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-white mb-2">{club.name}</h3>
                    <p className="text-white/70 text-base font-medium">{club.city}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-40 h-40 bg-brand-primary/20 rounded-full mb-4 flex items-center justify-center mx-auto">
            <span className="text-brand-primary font-bold text-3xl">К</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">
            {selectedSeasonId ? 'Клубы не найдены в этом сезоне' : 'Клубы не найдены'}
          </h3>
          <p className="text-white/70">
            {selectedSeasonId ? 'В выбранном сезоне нет клубов' : 'Информация о клубах будет добавлена позже'}
          </p>
        </div>
      )}
    </main>
  )
}


