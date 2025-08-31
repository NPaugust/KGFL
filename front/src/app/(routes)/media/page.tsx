"use client"
import { useMedia } from '@/hooks/useMedia'
import { Loading } from '@/components/Loading'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import Image from 'next/image'

export default function MediaPage() {
  const { media, loading, error } = useMedia()

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
                  <Image
                    src={item.image_url || item.image || '/placeholder.jpg'}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                  />
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
            <div className="text-6xl mb-4">📸</div>
            <h2 className="text-2xl font-bold mb-2">Галерея пуста</h2>
            <p className="text-white/70">Фотографии будут добавлены в ближайшее время</p>
          </div>
        )}
      </section>
    </main>
  )
} 