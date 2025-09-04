"use client"
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Loading } from '@/components/Loading'
import { useReferees } from '@/hooks/useReferees'
import Image from 'next/image'

export default function RefereesPage() {
  const { referees, loading, error } = useReferees()

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
            <div className="w-20 h-20 bg-brand-primary/20 rounded-full mb-4 flex items-center justify-center mx-auto">
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
        <h1 className="text-3xl font-bold text-center mb-8">Судьи</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {referees.map((referee) => (
            <div key={referee.id} className="card p-6 text-center">
              <div className="flex justify-center mb-4">
                {referee.photo_url || referee.photo ? (
                  <Image 
                    src={(() => {
                      const photo = referee.photo_url || referee.photo
                      return photo?.startsWith('http') ? photo : `/${photo}`
                    })()} 
                    alt={referee.name || 'Судья'} 
                    width={80} 
                    height={80} 
                    className="rounded-full object-contain bg-transparent" 
                  />
                ) : (
                  <div className="w-20 h-20 bg-brand-primary/20 rounded-full flex items-center justify-center">
                    <span className="text-brand-primary font-bold text-xl">
                      {referee.name?.charAt(0) || 'С'}
                    </span>
                  </div>
                )}
              </div>
              
              <h3 className="text-xl font-semibold text-white mb-2">{referee.name}</h3>
              <p className="text-brand-primary mb-3">{referee.category || 'Судья'}</p>
              
              {referee.experience && (
                <div className="text-white/70 text-sm mb-2">
                  Опыт: {referee.experience} {referee.experience === 1 ? 'год' : referee.experience < 5 ? 'года' : 'лет'}
                </div>
              )}
              
              {referee.matches && (
                <div className="text-white/70 text-sm">
                  Матчи: {referee.matches}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


