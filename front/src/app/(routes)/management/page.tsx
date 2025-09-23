"use client"
import { useEffect } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Loading } from '@/components/Loading'
import { useManagement } from '@/hooks/useManagement'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { getImageUrl } from '@/utils'

const positionMap: { [key: string]: string } = {
  president: 'Президент',
  vice_president: 'Вице-президент',
  general_secretary: 'Генеральный секретарь',
  director: 'Директор',
  manager: 'Менеджер',
  coach: 'Тренер',
  doctor: 'Врач',
  staff: 'Персонал',
};

export default function ManagementPage() {
  const { management, loading, error, refetch } = useManagement()
  
  const handleManagerClick = (manager: any) => {
    // Показываем информацию о руководителе
    const info = `
${manager.first_name} ${manager.last_name}
Должность: ${manager.position || 'Не указана'}
${manager.notes ? `\nЗаметки: ${manager.notes}` : ''}
    `.trim()
    alert(info)
  }
  
  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      if (event.detail.type === 'management') {
        console.log('Обновляем руководство...', event.detail.type)
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
          <Breadcrumbs items={[{ label: 'Руководство' }]} />
          <h1 className="text-3xl font-bold text-center">Руководство лиги</h1>
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
          <Breadcrumbs items={[{ label: 'Руководство' }]} />
          <h1 className="text-3xl font-bold text-center">Руководство лиги</h1>
          <div className="text-center text-red-400 mt-8">
            Ошибка загрузки данных: {typeof error === 'string' ? error : 'Неизвестная ошибка'}
          </div>
        </div>
      </div>
    )
  }

  if (!management || management.length === 0) {
    return (
      <div className="min-h-screen bg-brand-dark">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumbs items={[{ label: 'Руководство' }]} />
          <h1 className="text-3xl font-bold text-center">Руководство лиги</h1>
          <div className="text-center py-16">
            <div className="w-40 h-40 bg-brand-primary/20 rounded-full mb-4 flex items-center justify-center mx-auto">
              <span className="text-brand-primary font-bold text-3xl">Р</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Руководство не найдено</h3>
            <p className="text-white/70">Информация о руководстве будет добавлена позже</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-dark">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Руководство' }]} />
        <h1 className="text-3xl font-bold text-center mb-8">Руководство Кыргызской футбольной лиги</h1>
        
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {management.map((manager, index) => (
            <motion.div
              key={manager.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div 
                className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover:shadow-xl flex flex-col items-center text-center h-full"
              >
                {/* Фото руководителя */}
                <div className="w-40 h-40 rounded-full overflow-hidden border-2 border-white/20 mb-4 bg-white/10 flex-shrink-0 flex items-center justify-center">
                      {((manager as any).photo_url || manager.photo) ? (
                        <Image 
                          src={(manager as any).photo_url || getImageUrl(manager.photo || '')} 
                          alt={`${manager.first_name} ${manager.last_name}`} 
                          width={160} 
                          height={160} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image
                            src="/images/player-silhouette.png"
                            alt="Manager silhouette"
                            width={160}
                            height={160}
                            className="opacity-70 object-contain"
                          />
                        </div>
                      )}
                </div>

                {/* Информация о руководителе */}
                <div className="flex flex-col flex-grow w-full">
                  <h3 className="text-xl font-bold text-white mb-1">
                    {manager.first_name} {manager.last_name}
                  </h3>
                  <p className="text-brand-primary mb-2 font-medium">{positionMap[manager.position] || manager.position}</p>
                  
                  {manager.email && (
                    <div className="text-white/70 text-sm mb-2 break-words">
                      {manager.email}
                    </div>
                  )}
                  
                  {manager.notes && (
                    <div className="text-left mt-auto pt-3 border-t border-white/10">
                       <p className="text-white/80 text-sm">{manager.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}


