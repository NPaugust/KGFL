"use client"
import Image from 'next/image'
import { SeasonFilter } from './SeasonFilter'
import { useClubs } from '@/hooks/useClubs'
import { Loading } from './Loading'
import { TableRow } from '@/types'

type HeaderMode = 'full' | 'compact' | 'none'
export function LeagueTable({ headerMode = 'full', embedded = false, hideSubtitle = false }: { headerMode?: HeaderMode; embedded?: boolean; hideSubtitle?: boolean }) {
  const { table, tableLoading, tableError } = useClubs()

  if (tableLoading) {
    return (
      <section id="table" className={`${embedded ? '' : 'container-px'} ${embedded ? 'py-0' : 'py-16'}`}>
        <Loading />
      </section>
    )
  }

  if (tableError) {
    return (
      <section id="table" className={`${embedded ? '' : 'container-px'} ${embedded ? 'py-0' : 'py-16'}`}>
        <div className="text-center text-red-400">
          Ошибка загрузки таблицы: {typeof tableError === 'string' ? tableError : 'Неизвестная ошибка'}
        </div>
      </section>
    )
  }

  return (
    <section id="table" className={`${embedded ? '' : 'container-px'} ${embedded ? 'py-0' : 'py-16'}`}>
      {headerMode === 'full' && (
        <div className="mb-6 grid grid-cols-3 items-end gap-4">
          <div />
          <div className="text-center">
            <h2 className="text-4xl font-bold">Турнирная таблица</h2>
            <p className="text-white/70">Обновляется в реальном времени по окончании матчей</p>
          </div>
          <div className="justify-self-end"><SeasonFilter /></div>
        </div>
      )}
      {headerMode === 'compact' && (
        <div className="mb-4 flex items-end justify-between gap-4">
          <div className="text-left">
            <h2 className="text-lg font-semibold">Таблица</h2>
            {!hideSubtitle && <p className="text-white/70 text-sm">Обновляется в реальном времени по окончании матчей</p>}
          </div>
          <SeasonFilter />
        </div>
      )}
      {headerMode === 'none' && (
        <div className="mb-4 flex items-end justify-end">
          <SeasonFilter />
        </div>
      )}

      <div className="card overflow-hidden reveal">
        <div className="max-h-[730px] overflow-y-auto scroll-y">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <th className="px-4 py-3">№</th>
              <th className="px-4 py-3">Клуб</th>
              <th className="px-4 py-3">И</th>
              <th className="px-4 py-3">В</th>
              <th className="px-4 py-3">Н</th>
              <th className="px-4 py-3">П</th>
              <th className="px-4 py-3">Мячи</th>
              <th className="px-4 py-3 text-center">РГ</th>
              <th className="px-4 py-3 text-center">О</th>
              <th className="px-4 py-3 text-center">Р</th>
            </tr>
          </thead>
          <tbody>
            {table.map((r, idx) => (
              <tr key={r.id} className={idx % 2 ? 'bg-white/[0.03]' : 'bg-white/[0.06]'}>
                <td className="px-4 py-3 font-semibold text-white/80">{r.position || idx + 1}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {r.club_logo ? (
                      <Image 
                        src={r.club_logo.startsWith('http') ? r.club_logo : `/${r.club_logo}`} 
                        alt={r.club_name || 'Клуб'} 
                        width={28} 
                        height={28} 
                        className="rounded" 
                      />
                    ) : (
                      <div className="w-7 h-7 bg-white/10 rounded flex items-center justify-center text-xs text-white/40">
                        {r.club_name?.[0] || 'К'}
                      </div>
                    )}
                    <span className="font-medium">{r.club_name || 'Неизвестный клуб'}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{r.matches_played || r.played || 0}</td>
                <td className="px-4 py-3">{r.wins || r.win || 0}</td>
                <td className="px-4 py-3">{r.draws || r.draw || 0}</td>
                <td className="px-4 py-3">{r.losses || r.loss || 0}</td>
                <td className="px-4 py-3">{r.goals_formatted || `${r.goals_for}:${r.goals_against}`}</td>
                <td className="px-4 py-3 text-center font-medium">
                  <span className={(r.goal_difference || 0) > 0 ? 'text-green-400' : (r.goal_difference || 0) < 0 ? 'text-red-400' : 'text-gray-400'}>
                    {(r.goal_difference || 0) > 0 ? '+' : ''}{r.goal_difference || 0}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-bold text-[#F0D9C3]">{r.points}</td>
                <td className="px-4 py-3 text-center">
                  <div className="inline-flex items-center gap-2">
                    {r.last_5?.map((s, i) => (
                      <span
                        key={i}
                        title={s === 'W' ? 'Победа' : s === 'D' ? 'Ничья' : 'Поражение'}
                        className={
                          s === 'W'
                            ? 'inline-block h-3 w-3 rounded-full bg-green-400'
                            : s === 'D'
                            ? 'inline-block h-3 w-3 rounded-full bg-yellow-300'
                            : 'inline-block h-3 w-3 rounded-full bg-red-400'
                        }
                      />
                    )) || Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="inline-block h-3 w-3 rounded-full bg-gray-400" />
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </section>
  )
}


