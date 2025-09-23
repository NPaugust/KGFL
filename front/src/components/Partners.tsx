"use client"
import Image from 'next/image'
import { Reveal } from './Reveal'
import { useApi } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from './Loading'
import { getImageUrl } from '@/utils'

export function Partners() {
  const { data: partners, loading, error } = useApi(API_ENDPOINTS.PARTNERS)

  const handlePartnerClick = (partner: any) => {
    if (partner.url) {
      // Открываем URL в новой вкладке
      window.open(partner.url, '_blank')
    } else {
      // Показываем уведомление если URL отсутствует
      alert('URL партнера не указан')
    }
  }

  if (loading) {
    return (
      <Reveal as="section" className="container-px py-16">
        <Reveal as="h2" className="mb-6 text-3xl font-bold text-center" delay={100}>
          Партнеры лиги
        </Reveal>
        <Loading />
      </Reveal>
    )
  }

  if (error) {
    return (
      <Reveal as="section" className="container-px py-16">
        <Reveal as="h2" className="mb-6 text-3xl font-bold text-center" delay={100}>
          Партнеры лиги
        </Reveal>
        <div className="text-center text-red-400">
          Ошибка загрузки партнеров
        </div>
      </Reveal>
    )
  }

  const partnersList = Array.isArray(partners) ? partners : []

  return (
    <Reveal as="section" className="container-px py-16">
      <Reveal as="h2" className="mb-6 text-3xl font-bold text-center" delay={100}>
        Партнеры лиги
      </Reveal>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {partnersList.length > 0 ? partnersList.map((partner: any, i: number) => (
          <Reveal key={partner.id || i} className="card p-4 cursor-pointer hover:bg-white/10 transition-colors" delay={150 + i * 50}>
            <div onClick={() => handlePartnerClick(partner)}>
              {partner.logo ? (
                <Image 
                  src={getImageUrl(partner.logo)} 
                  alt={partner.name || "Партнер"} 
                  width={80} 
                  height={80} 
                  className="mx-auto h-20 w-20 object-contain" 
                />
              ) : (
                <div className="mx-auto h-20 w-20 bg-white/10 rounded flex items-center justify-center text-2xl text-white/40 font-bold">
                  {partner.name?.[0] || 'П'}
                </div>
              )}
              <div className="mt-2 text-center">
                <p className="text-sm font-medium">{partner.name}</p>
                {partner.category && (
                  <p className="text-xs text-white/60">{partner.category}</p>
                )}
              </div>
            </div>
          </Reveal>
         )): (
          <div className="col-span-full text-center text-white/60 py-8">Партнёры пока не добавлены</div>
        )}
      </div>
    </Reveal>
  )
}


