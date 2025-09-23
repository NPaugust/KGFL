"use client"
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { getImageUrl } from '@/utils'
import { SeasonFilter } from './SeasonFilter'
import { useClubs } from '@/hooks/useClubs'
import { Loading } from './Loading'
import { TableRow } from '@/types'

function Th({ title, hint, align = 'center' }: { title: string; hint: string; align?: 'left' | 'center' | 'right' }) {
  return (
    <th className={`px-4 py-3 text-${align}`}>
      <span title={hint} className="cursor-help inline-block">
        {title}
      </span>
    </th>
  )
}

type HeaderMode = 'full' | 'compact' | 'none'
export function LeagueTable({ headerMode = 'full', embedded = false, hideSubtitle = false }: { headerMode?: HeaderMode; embedded?: boolean; hideSubtitle?: boolean }) {
  const { table, tableLoading, tableError } = useClubs()
  const router = useRouter()

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

      {/* Заголовок и описание по центру (над таблицей) */}
      {!embedded && headerMode !== 'compact' && (
        <div className="text-center mb-4">
          <h2 className="text-4xl font-bold mb-2">Турнирная таблица</h2>
          {!hideSubtitle && (
            <p className="text-white/70 mb-2">Следите за результатами и статистикой клубов в текущем сезоне KGFL </p>
          )}
        </div>
      )}

      <div className="card overflow-hidden reveal relative">
        {/* Только верхняя цветная линия (учитывает скругления по углам) */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl bg-gradient-to-r from-brand-primary via-red-500 to-orange-400" />
        <div className="max-h-[730px] overflow-y-auto scroll-y">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-white/70">
            <tr>
              <Th title="№" hint="Позиция" align="center" />
              <Th title="Клуб" hint="Название команды" align="left" />
              <Th title="И" hint="Игры" align="center" />
              <Th title="В" hint="Выигрыши" align="center" />
              <Th title="Н" hint="Ничьи" align="center" />
              <Th title="П" hint="Поражения" align="center" />
              <Th title="Мячи" hint="Забитые:Пропущенные" align="center" />
              <Th title="РГ" hint="Разница голов" align="center" />
              <Th title="О" hint="Очки" align="center" />
              <Th title="Р" hint="Последние 5 игр" align="center" />
            </tr>
          </thead>
          <tbody>
            {table.map((r, idx) => {
              const position = r.position || idx + 1;
              // Цветные левые линии топ-5 разных цветов
              const posColors = ['border-emerald-500','border-sky-500','border-amber-500','border-fuchsia-500','border-rose-500'] as const;
              const bgColors   = ['bg-emerald-500/10','bg-sky-500/10','bg-amber-500/10','bg-fuchsia-500/10','bg-rose-500/10'] as const;
              let posClass = 'border-l-4 border-transparent';
              if (position <= 5) {
                posClass = `border-l-4 ${posColors[position-1]} ${bgColors[position-1]}`;
              }

              const wins = Number((r as any).wins ?? (r as any).win ?? 0) || 0;
              const draws = Number((r as any).draws ?? (r as any).draw ?? 0) || 0;
              const losses = Number((r as any).losses ?? (r as any).loss ?? 0) || 0;
              const summedGames = wins + draws + losses;
              const rawGames = (r as any).games ?? (r as any).matches_played ?? (r as any).played;
              const parsedRaw = rawGames !== undefined && rawGames !== null ? Number(rawGames) : undefined;
              const games = parsedRaw && parsedRaw > 0 ? parsedRaw : summedGames;

              return (
                <tr 
                  key={r.id} 
                  onClick={() => router.push(`/clubs/${r.club_id}`)}
                  className={`hover:bg-white/20 cursor-pointer transition-colors ${posClass} ${idx % 2 ? 'bg-white/[0.03]' : 'bg-white/[0.06]'}`}
                >
                  <td className="px-4 py-3 font-semibold text-white/80 text-center">{position}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {r.club_logo ? (
                        <Image 
                          src={getImageUrl(r.club_logo)} 
                          alt={r.club_name || 'Клуб'} 
                          width={40} 
                          height={40} 
                          className="w-10 h-10 object-contain rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-white/10 rounded flex items-center justify-center text-sm text-white/40">
                          {r.club_name?.[0] || 'К'}
                        </div>
                      )}
                      <span className="font-medium">{r.club_name || 'Неизвестный клуб'}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">{games}</td>
                  <td className="px-4 py-3 text-center">{r.wins ?? r.win ?? 0}</td>
                  <td className="px-4 py-3 text-center">{r.draws ?? r.draw ?? 0}</td>
                  <td className="px-4 py-3 text-center">{r.losses ?? r.loss ?? 0}</td>
                  <td className="px-4 py-3 text-center">{r.goals_formatted || `${r.goals_for}:${r.goals_against}`}</td>
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
                          title={s === 'W' ? 'Победа' : s === 'D' ? 'Ничья' : s === 'L' ? 'Поражение' : 'Нет данных'}
                          className={
                            s === 'W'
                              ? 'inline-block h-3 w-3 rounded-full bg-green-500'
                              : s === 'D'
                              ? 'inline-block h-3 w-3 rounded-full bg-gray-400'
                              : s === 'L'
                              ? 'inline-block h-3 w-3 rounded-full bg-red-500'
                              : 'inline-block h-3 w-3 rounded-full bg-gray-300'
                          }
                        />
                      )) || Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className="inline-block h-3 w-3 rounded-full bg-gray-400" />
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </section>
  )
}


