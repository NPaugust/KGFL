"use client"
import { useApi } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '@/components/Loading'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import Image from 'next/image'

export default function ManagementPage() {
  const { data: management, loading, error } = useApi(API_ENDPOINTS.MANAGEMENT)

  if (loading) {
    return (
      <main className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Руководство' }]} />
        <h1 className="text-3xl font-bold text-center">Руководство лиги</h1>
        <div className="mt-6 flex justify-center">
          <Loading />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Руководство' }]} />
        <h1 className="text-3xl font-bold text-center">Руководство лиги</h1>
        <div className="mt-6 text-center text-red-400">
          Ошибка загрузки данных
        </div>
      </main>
    )
  }

  const managementList = Array.isArray(management) ? management : []

  return (
    <main className="container-px py-10">
      <Breadcrumbs items={[{ label: 'Руководство' }]} />
      <h1 className="text-3xl font-bold text-center">Руководство лиги</h1>
      {managementList.length > 0 ? (
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {managementList.map((member) => (
            <div key={member.id} className="card p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16 overflow-hidden rounded-full">
                  <Image
                    src={member.photo || '/1.png'}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div>
                  <div className="text-xl font-semibold">{member.name}</div>
                  <div className="text-white/70">{member.position}</div>
                </div>
              </div>
              {member.bio && (
                <p className="mt-2 text-sm text-white/80">{member.bio}</p>
              )}
              {member.email && (
                <p className="mt-2 text-xs text-white/60">{member.email}</p>
              )}
              {member.phone && (
                <p className="text-xs text-white/60">{member.phone}</p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-6 text-center py-16">
          <div className="text-6xl mb-4">👔</div>
          <h3 className="text-xl font-semibold mb-2">Руководство не найдено</h3>
          <p className="text-white/70">Информация о руководстве будет добавлена в ближайшее время</p>
        </div>
      )}
    </main>
  )
}


