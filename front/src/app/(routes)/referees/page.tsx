"use client"
import { useApi } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '@/components/Loading'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import Image from 'next/image'

export default function RefereesPage() {
  const { data: referees, loading, error } = useApi(API_ENDPOINTS.REFEREES)

  if (loading) {
    return (
      <main className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Судьи' }]} />
        <h1 className="text-3xl font-bold text-center">Судьи</h1>
        <div className="mt-6 flex justify-center">
          <Loading />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Судьи' }]} />
        <h1 className="text-3xl font-bold text-center">Судьи</h1>
        <div className="mt-6 text-center text-red-400">
          Ошибка загрузки данных
        </div>
      </main>
    )
  }

  const refereesList = Array.isArray(referees) ? referees : []

  return (
    <main className="container-px py-10">
      <Breadcrumbs items={[{ label: 'Судьи' }]} />
      <h1 className="text-3xl font-bold text-center">Судьи</h1>
      {refereesList.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {refereesList.map((referee) => (
            <div key={referee.id} className="card p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16 overflow-hidden rounded-full">
                  <Image
                    src={referee.photo || '/1.png'}
                    alt={referee.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="text-xl font-semibold">{referee.name}</div>
                  <div className="text-white/70">{referee.position}</div>
                </div>
              </div>
              <div className="mt-2 rounded bg-white/10 px-2 py-1 text-sm w-fit">
                Опыт: {referee.experience} лет
              </div>
              {referee.bio && (
                <p className="mt-3 text-sm text-white/70">{referee.bio}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 text-center py-16">
          <div className="text-6xl mb-4">👨‍⚖️</div>
          <h3 className="text-xl font-semibold mb-2">Судьи не найдены</h3>
          <p className="text-white/70">Информация о судьях будет добавлена в ближайшее время</p>
        </div>
      )}
    </main>
  )
}


