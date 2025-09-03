"use client"
import { useEffect, useState } from 'react'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Loading } from '@/components/Loading'
import { apiClient, API_ENDPOINTS } from '@/services/api'
import { PlayerTransfer } from '@/types'

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<PlayerTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await apiClient.get<PlayerTransfer[]>(API_ENDPOINTS.PLAYER_TRANSFERS)
        setTransfers(Array.isArray(data) ? data : [])
      } catch (e: any) {
        setError(e?.message || 'Ошибка загрузки')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <section className="container-px py-16">
      <div className="mb-6">
        <Breadcrumbs items={[{ label: 'Трансферы' }]} />
        <h1 className="text-4xl font-bold">Последние трансферы</h1>
      </div>

      {loading && <Loading />}
      {error && <div className="text-red-400">{error}</div>}

      {!loading && !error && (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3">Игрок</th>
                  <th className="px-4 py-3">Из</th>
                  <th className="px-4 py-3">В</th>
                  <th className="px-4 py-3">Дата</th>
                  <th className="px-4 py-3">Статус</th>
                </tr>
              </thead>
              <tbody>
                {transfers.length ? transfers.map(t => (
                  <tr key={t.id} className="border-b border-white/10">
                    <td className="px-4 py-3">{typeof t.player === 'object' ? `${t.player.first_name} ${t.player.last_name}` : t.player}</td>
                    <td className="px-4 py-3">{typeof t.from_club === 'object' ? t.from_club?.name : (t.from_club || 'Свободный агент')}</td>
                    <td className="px-4 py-3">{typeof t.to_club === 'object' ? t.to_club?.name : t.to_club}</td>
                    <td className="px-4 py-3">{new Date(t.transfer_date).toLocaleDateString('ru-RU')}</td>
                    <td className="px-4 py-3">{t.status === 'confirmed' ? 'Подтвержден' : t.status === 'pending' ? 'Ожидание' : 'Отменен'}</td>
                  </tr>
                )) : (
                  <tr>
                    <td className="px-4 py-6 text-white/60" colSpan={5}>Нет данных</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}


