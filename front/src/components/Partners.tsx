"use client"
import Image from 'next/image'
import { Reveal } from './Reveal'
import { useApi } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from './Loading'

export function Partners() {
  const { data: partners, loading, error } = useApi(API_ENDPOINTS.PARTNERS)

  if (loading) {
    return (
      <Reveal as="section" className="container-px py-16">
        <Reveal as="h2" className="mb-6 text-2xl font-bold text-center" delay={100}>
          Партнеры лиги
        </Reveal>
        <Loading />
      </Reveal>
    )
  }

  if (error) {
    return (
      <Reveal as="section" className="container-px py-16">
        <Reveal as="h2" className="mb-6 text-2xl font-bold text-center" delay={100}>
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
      <Reveal as="h2" className="mb-6 text-2xl font-bold text-center" delay={100}>
        Партнеры лиги
      </Reveal>
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
        {partnersList.length > 0 ? partnersList.map((partner: any, i: number) => (
          <Reveal key={partner.id || i} className="card p-4" delay={150 + i * 50}>
            <Image 
              src={partner.logo || "/logo.png.png"} 
              alt={partner.name || "Партнер"} 
              width={80} 
              height={80} 
              className="mx-auto h-20 w-20" 
            />
            <div className="mt-2 text-center">
              <p className="text-sm font-medium">{partner.name}</p>
              {partner.category && (
                <p className="text-xs text-white/60">{partner.category}</p>
              )}
            </div>
          </Reveal>
        )) : (
          <div className="col-span-full text-center text-white/60 py-8">
            Партнеры не найдены
          </div>
        )}
      </div>
    </Reveal>
  )
}


