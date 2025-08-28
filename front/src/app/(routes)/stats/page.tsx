"use client"
import { useState } from 'react'
import { SelectMenu as Select } from '@/components/Filters'
import { useApi } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '@/components/Loading'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export default function StatsPage() {
  const [season, setSeason] = useState('2024')
  const [metric, setMetric] = useState<'goals_scored' | 'assists' | 'yellow_cards' | 'red_cards'>('goals_scored')
  
  const { data: players, loading, error } = useApi(API_ENDPOINTS.PLAYERS)

  if (loading) {
    return (
      <main className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Статистика' }]} />
        <h1 className="text-3xl font-bold text-center">Статистика игроков</h1>
        <div className="mt-6 flex justify-center">
          <Loading />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Статистика' }]} />
        <h1 className="text-3xl font-bold text-center">Статистика игроков</h1>
        <div className="mt-6 text-center text-red-400">
          Ошибка загрузки данных
        </div>
      </main>
    )
  }

  const playersList = Array.isArray(players) ? players : []
  const displayed = playersList
    .filter((p) => p.season === season)
    .sort((a, b) => (b[metric] as number || 0) - (a[metric] as number || 0))

  return (
    <main className="container-px py-10">
      <Breadcrumbs items={[{ label: 'Статистика' }]} />
      <h1 className="text-3xl font-bold text-center">Статистика игроков</h1>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Select label="Сезон" value={season} onChange={setSeason} options={[{ label: '2024', value: '2024' }, { label: '2023', value: '2023' }]} />
        <Select
          label="Метрика"
          value={metric}
          onChange={(v) => setMetric(v as any)}
          options={[
            { label: 'Голы', value: 'goals_scored' },
            { label: 'Ассисты', value: 'assists' },
            { label: 'Жёлтые карточки', value: 'yellow_cards' },
            { label: 'Красные карточки', value: 'red_cards' },
          ]}
        />
      </div>

      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-4 py-3">Игрок</th>
              <th className="px-4 py-3">Команда</th>
              <th className="px-4 py-3">Игры</th>
              <th className="px-4 py-3">Сезон</th>
              <th className="px-4 py-3">Показатель</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length > 0 ? displayed.map((p) => (
              <tr key={p.id}>
                <td className="px-4 py-3 font-medium">{p.name}</td>
                <td className="px-4 py-3">{p.club?.name || 'Неизвестный клуб'}</td>
                <td className="px-4 py-3">{p.games_played || 0}</td>
                <td className="px-4 py-3">{p.season || '2024'}</td>
                <td className="px-4 py-3 font-semibold text-brand-accent">{p[metric] || 0}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-white/60">
                  Статистика не найдена
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}


