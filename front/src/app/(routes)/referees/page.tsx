"use client"
import { useEffect } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Loading } from '@/components/Loading'
import { useReferees } from '@/hooks/useReferees'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { getImageUrl } from '@/utils'

const categoryMap: { [key: string]: string } = {
  main: 'Главный судья',
  assistant: 'Помощник судьи',
  reserve: 'Резервный судья',
  var: 'Видеоассистент (VAR)',
};

export default function RefereesPage() {
  const { referees, loading, error, refetch } = useReferees()
  
  const handleRefereeClick = (referee: any) => {
    // Показываем информацию о судье
    const info = `
${referee.first_name} ${referee.last_name}
Категория: ${referee.category || 'Не указана'}
Национальность: ${referee.nationality || 'Не указана'}
Стаж: ${referee.experience_years || 'Не указан'} лет
${referee.bio ? `\nБиография: ${referee.bio}` : ''}
    `.trim()
    alert(info)
  }
  
  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      if (event.detail.type === 'referee') {
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
          <Breadcrumbs items={[{ label: 'Судьи' }]} />
          <h1 className="text-3xl font-bold text-center">Судьи</h1>
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
          <Breadcrumbs items={[{ label: 'Судьи' }]} />
          <h1 className="text-3xl font-bold text-center">Судьи</h1>
          <div className="text-center text-red-400 mt-8">
            Ошибка загрузки данных: {typeof error === 'string' ? error : 'Неизвестная ошибка'}
          </div>
        </div>
      </div>
    )
  }

  if (!referees || referees.length === 0) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs items={[{ label: 'Судьи' }]} />
          <h1 className="text-3xl font-bold text-center">Судьи</h1>
          <div className="text-center py-16">
            <div className="w-40 h-40 bg-brand-primary/20 rounded-full mb-4 flex items-center justify-center mx-auto">
              <span className="text-brand-primary font-bold text-3xl">С</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Судьи не найдены</h3>
            <p className="text-white/70">Информация о судьях будет добавлена позже</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Судьи' }]} />
        <h1 className="text-3xl font-bold text-center mb-8">Судейский состав</h1>
        
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {referees.map((referee, index) => (
            <motion.div
              key={referee.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div 
                className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl cursor-pointer"
                onClick={() => handleRefereeClick(referee)}
              >
                {/* Фото судьи */}
                <div className="flex justify-center mb-4">
                  <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-white/20">
                    {referee.photo ? (
                      <Image 
                        src={getImageUrl(referee.photo)} 
                        alt={`${referee.first_name || ''} ${referee.last_name || ''}`} 
                        width={160} 
                        height={160} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/5">
                        <Image
                          src="/images/player-silhouette.png"
                          alt="Referee silhouette"
                          width={120}
                          height={120}
                          className="opacity-70 object-contain"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Информация о судье */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {referee.first_name} {referee.last_name}
                  </h3>
                  <p className="text-brand-primary mb-3 font-medium">{referee.category ? categoryMap[referee.category] : 'Судья'}</p>
                  
                  {/* Дополнительная информация */}
                  <div className="space-y-2 text-sm">
                    {referee.region && (
                      <div className="flex justify-between text-white/60">
                        <span>Регион:</span>
                        <span className="text-white/80">{referee.region}</span>
                      </div>
                    )}
                    {referee.experience_months && (
                      <div className="flex justify-between text-white/60">
                        <span>Опыт:</span>
                        <span className="text-white/80">
                          {Math.floor(referee.experience_months / 12)} {Math.floor(referee.experience_months / 12) === 1 ? 'год' : Math.floor(referee.experience_months / 12) < 5 ? 'года' : 'лет'}
                        </span>
                      </div>
                    )}
                    {referee.phone && (
                      <div className="flex justify-between text-white/60">
                        <span>Телефон:</span>
                        <span className="text-white/80 text-xs">{referee.phone}</span>
                      </div>
                    )}

                    {referee.nationality && (
                      <div className="flex justify-between text-white/60">
                        <span>Гражданство:</span>
                        <span className="text-white/80">{referee.nationality}</span>
                      </div>
                    )}
                  </div>

                  {/* Статус судьи */}
                  <div className="mt-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      referee.is_active 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                    }`}>
                      {referee.is_active ? 'Активный' : 'Неактивный'}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}


