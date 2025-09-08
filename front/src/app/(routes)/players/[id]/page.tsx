"use client"
import { useParams } from 'next/navigation'
import { usePlayer } from '@/hooks/usePlayers'
import { useApi } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import Image from 'next/image'
import Link from 'next/link'

export default function PlayerDetailsPage() {
  const params = useParams()
  const id = params.id as string
  const { player, loading, error } = usePlayer(id)
  const { data: transfersData } = useApi<any[]>(API_ENDPOINTS.PLAYER_TRANSFERS, { player: id }, [id])
  const transfers = Array.isArray(transfersData) ? transfersData : []

  if (loading) return <div className="p-8">Загрузка...</div>
  if (error || !player) return <div className="p-8">Игрок не найден</div>

  return (
    <main className="container mx-auto px-4 py-12">
      <Link href="/" className="text-white/70">← На главную</Link>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
        <div className="card p-6">
          <div className="flex items-center gap-4">
            {player.photo ? (
              <Image src={player.photo.startsWith('http') ? player.photo : `/${player.photo}`} alt={player.first_name} width={96} height={96} className="rounded-full object-contain bg-transparent" />
            ) : (
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center text-xl">{player.first_name?.[0]}{player.last_name?.[0]}</div>
            )}
            <div>
              <div className="text-2xl font-bold">{player.first_name} {player.last_name}</div>
              <div className="text-white/70">{player.position}</div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 card p-6">
          <h2 className="text-xl font-bold mb-4">История трансферов</h2>
          {transfers.length === 0 ? (
            <div className="text-white/60">Переходов пока нет</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr><th className="px-4 py-3 text-left">Дата</th><th className="px-4 py-3 text-left">Из</th><th className="px-4 py-3 text-left">В</th><th className="px-4 py-3 text-left">Статус</th></tr>
                </thead>
                <tbody>
                  {transfers.map((t:any)=> (
                    <tr key={t.id} className="border-b border-white/10">
                      <td className="px-4 py-3">{t.transfer_date}</td>
                      <td className="px-4 py-3">{t.from_club?.name || 'Свободный агент'}</td>
                      <td className="px-4 py-3">{t.to_club?.name || '-'}</td>
                      <td className="px-4 py-3">{t.status === 'confirmed' ? 'Подтверждён' : t.status === 'pending' ? 'Ожидание' : 'Отменён'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
