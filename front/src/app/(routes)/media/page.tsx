"use client"
import { useEffect } from 'react'
import { useMedia } from '@/hooks/useMedia'
import { Loading } from '@/components/Loading'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import Image from 'next/image'

export default function MediaPage() {
  const { media, loading, error, refetch } = useMedia()
  
  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      if (event.detail.type === 'media') {
        console.log('Обновляем медиа...', event.detail.type)
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
      <main>
        <section className="container-px py-10">
          <Breadcrumbs items={[{ label: 'Медиа' }]} />
          <h1 className="text-4xl font-bold text-center">Медиа</h1>
          <p className="mt-2 text-white/70 text-center">Галерея фотографий KGFL</p>
        </section>
        <section className="container-px py-16">
          <Loading />
        </section>
      </main>
    )
  }

  if (error) {
    return (
      <main>
        <section className="container-px py-10">
          <Breadcrumbs items={[{ label: 'Медиа' }]} />
          <h1 className="text-4xl font-bold text-center">Медиа</h1>
          <p className="mt-2 text-white/70 text-center">Галерея фотографий KGFL</p>
        </section>
        <section className="container-px py-16">
          <div className="text-center text-red-400">
            Ошибка загрузки медиа файлов
          </div>
        </section>
      </main>
    )
  }

  return (
    <main>
      <section className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Медиа' }]} />
        <h1 className="text-4xl font-bold text-center">Медиа</h1>
        <p className="mt-2 text-white/70 text-center">Галерея фотографий KGFL</p>
      </section>
      
      <section className="container-px py-16">
        {media.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {media.map((item) => (
              <div key={item.id} className="card overflow-hidden group cursor-pointer">
                <div className="relative aspect-square overflow-hidden">
                  {item.image_url || item.image ? (
                    <Image
                      src={(() => {
                        const image = item.image_url || item.image
                        return image?.startsWith('http') ? image : `/${image}`
                      })()}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-white/10 flex items-center justify-center text-4xl text-white/40 font-bold">
                      {item.title?.[0] || 'М'}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm text-white/70">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-brand-primary/20 rounded-full mb-4 flex items-center justify-center mx-auto">
              <span className="text-brand-primary font-bold text-3xl">М</span>
            </div>
            <h3 className="text-xl font-semibold mb-2">Фотографии не найдены</h3>
            <p className="text-white/70">Галерея будет обновлена новыми фотографиями</p>
          </div>
        )}
      </section>
    </main>
  )
} 