"use client"
import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useClubs } from '@/hooks/useClubs'
import { Loading } from '@/components/Loading'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { getImageUrl } from '@/utils'
import { motion } from 'framer-motion'

export default function ClubsPage() {
  const { clubs, clubsLoading: loading, clubsError: error, refetchClubs } = useClubs()
  
  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      const refreshTypes = ['match', 'club', 'player', 'player_stats', 'transfer', 'season']
      if (refreshTypes.includes(event.detail.type)) {
        console.log('Обновляем клубы...', event.detail.type)
        refetchClubs()
      }
    }

    window.addEventListener('data-refresh', handleDataRefresh as EventListener)
    return () => {
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener)
    }
  }, [refetchClubs])

  if (loading) {
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

  const clubsList = Array.isArray(clubs) ? clubs : []

  return (
    <main className="container-px py-10">
      <Breadcrumbs items={[{ label: 'Клубы' }]} />
      <h1 className="text-3xl font-bold text-center mb-8">Команды лиги</h1>
      {clubsList.length > 0 ? (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {clubsList.map((club, index) => (
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
                    <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-white/20 bg-gray-800 flex items-center justify-center">
                      {club.logo ? (
                        <Image 
                          src={getImageUrl(club.logo)} 
                          alt={club.name} 
                          width={160} 
                          height={160} 
                          className="w-full h-full object-cover" 
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
                    <p className="text-white/70 text-sm mb-3">{club.city}</p>
                    
                    {/* Дополнительная информация */}
                    <div className="space-y-2 text-sm">
                      {club.founded && (
                        <div className="flex justify-between text-white/60">
                          <span>Основан:</span>
                          <span className="text-white/80">{club.founded}</span>
                        </div>
                      )}
                      {club.city && (
                        <div className="flex justify-between text-white/60">
                          <span>Город:</span>
                          <span className="text-white/80">{club.city}</span>
                        </div>
                      )}
                      {/* Цвета формы убираем с публичной карточки — переносим в детальную страницу клуба */}
                    </div>

                    {/* Статус клуба */}
                    <div className="mt-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        club.status === 'active' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : club.status === 'applied'
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                      }`}>
                        {club.status === 'active' ? 'Активный' : 
                         club.status === 'applied' ? 'Подал заявку' : 
                         'Неактивный'}
                      </span>
                    </div>
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
          <h3 className="text-xl font-semibold mb-2">Клубы не найдены</h3>
          <p className="text-white/70">Информация о клубах будет добавлена позже</p>
        </div>
      )}
    </main>
  )
}


