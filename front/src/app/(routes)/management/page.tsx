"use client"
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Loading } from '@/components/Loading'
import { useManagement } from '@/hooks/useManagement'
import Image from 'next/image'

export default function ManagementPage() {
  const { management, loading, error } = useManagement()

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
        <h1 className="text-3xl font-bold text-center mb-8">Руководство лиги</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {management.map((manager) => (
            <div key={manager.id} className="card p-6 text-center">
              <div className="flex justify-center mb-4">
                {manager.photo ? (
                  <Image 
                    src={manager.photo} 
                    alt={manager.name} 
                    width={80} 
                    height={80} 
                    className="rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-20 h-20 bg-brand-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-brand-primary font-bold text-xl">
                      {manager.name?.charAt(0) || 'Р'}
                    </span>
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-2">{manager.name}</h3>
              <p className="text-brand-primary mb-3">{manager.position}</p>
              
              {manager.contact && (
                <p className="text-white/70 text-sm">{manager.contact}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


