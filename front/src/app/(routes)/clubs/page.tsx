"use client"
import Link from 'next/link'
import { useClubs } from '@/hooks/useClubs'
import { Loading } from '@/components/Loading'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export default function ClubsPage() {
  const { clubs, clubsLoading: loading, clubsError: error } = useClubs()

  if (loading) {
    return (
      <main className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Клубы' }]} />
        <h1 className="text-3xl font-bold text-center">Команды лиги</h1>
        <div className="mt-6 flex justify-center">
          <Loading />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Клубы' }]} />
        <h1 className="text-3xl font-bold text-center">Команды лиги</h1>
        <div className="mt-6 text-center text-red-400">
          Ошибка загрузки данных
        </div>
      </main>
    )
  }

  const clubsList = Array.isArray(clubs) ? clubs : []

  return (
    <main className="container-px py-10">
      <Breadcrumbs items={[{ label: 'Клубы' }]} />
      <h1 className="text-3xl font-bold text-center">Команды лиги</h1>
      {clubsList.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {clubsList.map((club) => (
            <Link key={club.id} href={`/clubs/${club.id}`} className="card p-5 hover:bg-white/10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-primary/20 rounded-lg flex items-center justify-center">
                  <span className="text-brand-primary font-bold text-lg">К</span>
                </div>
                <div>
                  <div className="font-semibold">{club.name}</div>
                  <div className="text-white/70 text-sm">{club.city}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-brand-primary/20 rounded-full mb-4 flex items-center justify-center mx-auto">
            <span className="text-brand-primary font-bold text-3xl">К</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Клубы не найдены</h3>
          <p className="text-white/70">Информация о клубах будет добавлена позже</p>
        </div>
      )}
    </main>
  )
}


