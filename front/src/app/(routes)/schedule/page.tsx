"use client"
import { useState } from 'react'
import { SelectMenu as Select } from '@/components/Filters'
import { useApi } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '@/components/Loading'
import { Breadcrumbs } from '@/components/Breadcrumbs'

export default function SchedulePage() {
  const [season, setSeason] = useState('2024')
  const [round, setRound] = useState('Все')
  
  const { data: matches, loading, error } = useApi(API_ENDPOINTS.MATCHES)
  
  if (loading) {
    return (
      <main className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Расписание' }]} />
        <h1 className="text-3xl font-bold text-center">Расписание матчей</h1>
        <div className="mt-6 flex justify-center">
          <Loading />
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container-px py-10">
        <Breadcrumbs items={[{ label: 'Расписание' }]} />
        <h1 className="text-3xl font-bold text-center">Расписание матчей</h1>
        <div className="mt-6 text-center text-red-400">
          Ошибка загрузки данных
        </div>
      </main>
    )
  }

  const matchesList = Array.isArray(matches) ? matches : []
  const filtered = matchesList.filter((m) => m.season === season && (round === 'Все' || m.round === round))
  const rounds = ['Все', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']

  return (
    <main className="container-px py-10">
      <Breadcrumbs items={[{ label: 'Расписание' }]} />
      <h1 className="text-3xl font-bold text-center">Расписание матчей</h1>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Select label="Сезон" value={season} onChange={setSeason} options={[{ label: '2024', value: '2024' }, { label: '2023', value: '2023' }]} />
        <Select label="Тур" value={round} onChange={setRound} options={rounds.map((r) => ({ label: r, value: r }))} />
      </div>

      <div className="card mt-6 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3">Хозяева</th>
              <th className="px-4 py-3">Счёт</th>
              <th className="px-4 py-3">Гости</th>
              <th className="px-4 py-3">Стадион</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Время</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? filtered.map((m) => (
              <tr key={m.id}>
                <td className="px-4 py-3">{new Date(m.date).toLocaleDateString('ru-RU')}</td>
                <td className="px-4 py-3">{m.home_team?.name || 'Неизвестная команда'}</td>
                <td className="px-4 py-3 text-white/60">
                  {m.home_score !== undefined && m.away_score !== undefined 
                    ? `${m.home_score} : ${m.away_score}` 
                    : '—'
                  }
                </td>
                <td className="px-4 py-3">{m.away_team?.name || 'Неизвестная команда'}</td>
                <td className="px-4 py-3">{m.venue || 'Не указан'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    m.status === 'finished' ? 'bg-green-500/20 text-green-400' :
                    m.status === 'live' ? 'bg-red-500/20 text-red-400' :
                    m.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {m.status === 'finished' ? 'Завершен' :
                     m.status === 'live' ? 'В процессе' :
                     m.status === 'cancelled' ? 'Отменен' : 'Запланирован'}
                  </span>
                </td>
                <td className="px-4 py-3">{new Date(m.date).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-white/60">
                  Матчи не найдены
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  )
}


