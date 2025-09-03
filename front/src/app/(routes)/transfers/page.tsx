"use client"
import { useApi } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import Link from 'next/link'

export default function TransfersPage() {
  const { data, loading, error } = useApi<any[]>(API_ENDPOINTS.PLAYER_TRANSFERS)
  const transfers = Array.isArray(data) ? data : []

  return (
    <main className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-6">Последние трансферы</h1>

      {loading ? (
        <div className="text-white/60">Загрузка...</div>
      ) : error ? (
        <div className="text-red-400">Ошибка загрузки</div>
      ) : transfers.length === 0 ? (
        <div className="text-white/60">Пока нет трансферов</div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5">
                <tr>
                  <th className="px-4 py-3 text-left">Дата</th>
                  <th className="px-4 py-3 text-left">Игрок</th>
                  <th className="px-4 py-3 text-left">Из</th>
                  <th className="px-4 py-3 text-left">В</th>
                  <th className="px-4 py-3 text-left">Статус</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((t:any) => (
                  <tr key={t.id} className="border-b border-white/10">
                    <td className="px-4 py-3">{t.transfer_date}</td>
                    <td className="px-4 py-3 font-medium">{t.player_full_name || t.player?.first_name + ' ' + t.player?.last_name || 'Игрок'}</td>
                    <td className="px-4 py-3">{t.from_club?.name || 'Свободный агент'}</td>
                    <td className="px-4 py-3">{t.to_club?.name || '-'}</td>
                    <td className="px-4 py-3">{t.status === 'confirmed' ? 'Подтверждён' : t.status === 'pending' ? 'Ожидание' : 'Отменён'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-8 text-center">
        <Link href="/" className="btn btn-outline">На главную</Link>
      </div>
    </main>
  )
}


