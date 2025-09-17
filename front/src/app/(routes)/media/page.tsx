"use client"
import { useEffect } from 'react'
import { useMedia } from '@/hooks/useMedia'
import { Loading } from '@/components/Loading'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import Image from 'next/image'

interface Media {
  id: string
  title: string
  description: string
  file: string
  file_url?: string
  image_url?: string
  image?: string
  url?: string
  preview?: string
  preview_url?: string
  created_at: string
  media_type: 'image' | 'video' | 'document'
}

export default function MediaPage() {
  const { media, loading, error, refetch } = useMedia()
  
  const handleMediaClick = (item: any) => {
    // Проверяем тип медиа
    if (item.media_type === 'video' && item.url) {
      // Для видео открываем URL ссылку (YouTube или любую другую)
      window.open(item.url, '_blank')
    } else if (item.media_type === 'document' && item.url) {
      // Для документов открываем URL ссылку
      window.open(item.url, '_blank')
    } else {
      // Для изображений открываем файл
      const imageUrl = (item as any).file_url || (item as any).image_url || (item as any).image || (item as any).url
      if (imageUrl) {
        window.open(imageUrl, '_blank')
      }
    }
  }
  
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
              <div 
                key={item.id} 
                className="card overflow-hidden group cursor-pointer hover:scale-105 transition-transform"
                onClick={() => handleMediaClick(item)}
              >
                <div className="relative aspect-square overflow-hidden">
                  {item.media_type === 'image' ? (
                    // Для изображений показываем файл
                    (item as Media).file_url || (item as Media).image_url || (item as Media).image || item.file ? (
                      <Image
                        src={(() => {
                          const image = (item as Media).file_url || (item as Media).image_url || (item as Media).image || item.file
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
                    )
                  ) : (
                    // Для видео и документов показываем превью или иконку
                    (item as Media).preview_url || (item as Media).preview ? (
                      <Image
                        src={(item as Media).preview_url || (item as Media).preview || ''}
                        alt={item.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M8 5v14l11-7z"/>
                            </svg>
                          </div>
                          <div className="text-sm text-white/80 font-medium">
                            {item.media_type === 'video' ? 'YouTube' : 'Документ'}
                          </div>
                        </div>
                      </div>
                    )
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