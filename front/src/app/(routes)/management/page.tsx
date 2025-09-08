"use client"
import { useEffect } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Loading } from '@/components/Loading'
import { useManagement } from '@/hooks/useManagement'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { getImageUrl } from '@/utils'

export default function ManagementPage() {
  const { management, loading, error, refetch } = useManagement()
  
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
            <div className="w-20 h-20 bg-brand-primary/20 rounded-full mb-4 flex items-center justify-center mx-auto">
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
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                {/* Фото руководителя */}
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-white/20">
                    {manager.photo ? (
                      <Image 
                        src={getImageUrl(manager.photo)} 
                        alt={manager.name || 'Руководитель'} 
                        width={96} 
                        height={96} 
                        className="w-full h-full object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand-primary to-blue-500 flex items-center justify-center">
                        <span className="text-white font-bold text-2xl">
                          {manager.name?.[0] || 'Р'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Информация о руководителе */}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {manager.name}
                  </h3>
                  <p className="text-brand-primary mb-3 font-medium">{manager.position}</p>
                  
                  {/* Дополнительная информация */}
                  <div className="space-y-2 text-sm">
                    {manager.bio && (
                      <div className="text-white/70 text-xs text-center">
                        {manager.bio}
                      </div>
                    )}
                    {manager.phone && (
                      <div className="flex justify-between text-white/60">
                        <span>Телефон:</span>
                        <span className="text-white/80 text-xs">{manager.phone}</span>
                      </div>
                    )}
                    {manager.contact && (
                      <div className="flex justify-between text-white/60">
                        <span>Контакты:</span>
                        <span className="text-white/80 text-xs truncate">{manager.contact}</span>
                      </div>
                    )}
                  </div>

                  {/* Статус руководителя */}
                  <div className="mt-4">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                      Активный
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


