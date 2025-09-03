"use client"
import { useState, useEffect } from 'react'
import { useMatches } from '@/hooks/useMatches'
import { useClubs } from '@/hooks/useClubs'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Match, Club } from '@/types'
import { Loading } from '../Loading'
import { formatDate } from '@/utils'
import { apiClient } from '@/services/api'
import { useApi } from '@/hooks/useApi'

interface MatchFormData {
  date: string
  time?: string
  home_team: string
  away_team: string
  stadium?: string
  stadium_ref?: string
  status: 'scheduled' | 'live' | 'finished' | 'cancelled' | 'postponed'
  home_score?: number
  away_score?: number
  // События матча
  goals: GoalEvent[]
  yellow_cards: SimpleEvent[]
  red_cards: SimpleEvent[]
}

interface SimpleEvent { id: string; player_id: string; minute: number; team: 'home' | 'away' }
interface GoalEvent extends SimpleEvent { assist_player_id?: string }

export function MatchesManager() {
  const { matches, loading, refetch } = useMatches()
  const { clubs } = useClubs()
  const { data: stadiums } = useApi<any[]>(API_ENDPOINTS.STADIUMS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [homePlayers, setHomePlayers] = useState<any[]>([])
  const [awayPlayers, setAwayPlayers] = useState<any[]>([])
  const [formData, setFormData] = useState<MatchFormData>({
    date: '',
    time: '',
    home_team: '',
    away_team: '',
    stadium: '',
    status: 'scheduled',
    home_score: undefined,
    away_score: undefined,
    goals: [],
    yellow_cards: [],
    red_cards: []
  })

  const { mutate, loading: mutationLoading, error } = useApiMutation<Match>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const stadiumValue = formData.stadium ? String(formData.stadium).trim() : ''
      const computedHome = formData.goals.filter(g => g.team === 'home').length
      const computedAway = formData.goals.filter(g => g.team === 'away').length

      const submitData = {
        ...formData,
        home_team: formData.home_team || null,
        away_team: formData.away_team || null,
        date: formData.date || null,
        time: formData.time || null,
        stadium: stadiumValue,
        home_score: formData.status === 'scheduled' ? null : computedHome,
        away_score: formData.status === 'scheduled' ? null : computedAway
      }

      let savedMatch: any
      if (editingMatch) savedMatch = await mutate(API_ENDPOINTS.MATCH_DETAIL(editingMatch.id.toString()), 'PUT', submitData)
      else savedMatch = await mutate(API_ENDPOINTS.MATCHES, 'POST', submitData)

      const matchId = (savedMatch as any)?.id || editingMatch?.id?.toString()
      const homeTeamId = formData.home_team
      const awayTeamId = formData.away_team
      if (matchId && (formData.status === 'live' || formData.status === 'finished')) {
        for (const goal of formData.goals) {
          try {
            await apiClient.post(API_ENDPOINTS.GOALS, {
              match: matchId,
              scorer: goal.player_id,
              assist: goal.assist_player_id || null,
              team: goal.team === 'home' ? homeTeamId : awayTeamId,
              minute: goal.minute,
              goal_type: 'goal',
            })
          } catch {}
        }
        for (const yc of formData.yellow_cards) {
          try {
            await apiClient.post(API_ENDPOINTS.CARDS, {
              match: matchId,
              player: yc.player_id,
              team: yc.team === 'home' ? homeTeamId : awayTeamId,
              card_type: 'yellow',
              minute: yc.minute,
            })
          } catch {}
        }
        for (const rc of formData.red_cards) {
          try {
            await apiClient.post(API_ENDPOINTS.CARDS, {
              match: matchId,
              player: rc.player_id,
              team: rc.team === 'home' ? homeTeamId : awayTeamId,
              card_type: 'red',
              minute: rc.minute,
            })
          } catch {}
        }
      }

      setIsModalOpen(false)
      setEditingMatch(null)
      setFormData({ date: '', time: '', home_team: '', away_team: '', stadium: '', status: 'scheduled', home_score: undefined, away_score: undefined, goals: [], yellow_cards: [], red_cards: [] })
      refetch()
    } catch (error) {
      alert(`Ошибка при сохранении матча`)
    }
  }

  const handleEdit = (match: Match) => {
    setEditingMatch(match)
    const homeTeamId = (match as any).home_team?.id ? (match as any).home_team.id.toString() : (match as any).home_team || ''
    const awayTeamId = (match as any).away_team?.id ? (match as any).away_team.id.toString() : (match as any).away_team || ''
    setFormData({
      date: match.date ? new Date(match.date).toISOString().split('T')[0] : '',
      time: (match as any).time || '',
      home_team: homeTeamId,
      away_team: awayTeamId,
      stadium: (match as any).stadium || '',
      stadium_ref: (match as any).stadium_ref || '',
      status: (match as any).status || 'scheduled',
      home_score: (match as any).home_score ?? undefined,
      away_score: (match as any).away_score ?? undefined,
      goals: [],
      yellow_cards: [],
      red_cards: []
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (matchId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот матч?')) {
      try {
        await mutate(API_ENDPOINTS.MATCH_DETAIL(matchId), 'DELETE')
        refetch()
      } catch (error) {
        alert(`Ошибка при удалении матча`)
      }
    }
  }

  const addEvent = (type: 'goals' | 'yellow_cards' | 'red_cards') => {
    const base: any = { id: Date.now().toString(), player_id: '', minute: 1, team: 'home' }
    const newEvent: any = type === 'goals' ? { ...base, assist_player_id: '' } : base
    setFormData({ ...formData, [type]: [...formData[type], newEvent] })
  }
  const updateEvent = (type: 'goals' | 'yellow_cards' | 'red_cards', eventId: string, field: string, value: any) => {
    setFormData({ ...formData, [type]: formData[type].map(event => event.id === eventId ? { ...event, [field]: value } : event) })
  }
  const removeEvent = (type: 'goals' | 'yellow_cards' | 'red_cards', eventId: string) => {
    setFormData({ ...formData, [type]: formData[type].filter(event => event.id !== eventId) })
  }

  const loadPlayers = async (clubId: string, side: 'home'|'away') => {
    if (!clubId) return
    try {
      const players = await apiClient.get<any[]>(API_ENDPOINTS.CLUB_PLAYERS(clubId))
      if (side === 'home') setHomePlayers(players || [])
      else setAwayPlayers(players || [])
    } catch {}
  }

  useEffect(() => {
    if (!isModalOpen) return
    if (formData.home_team) loadPlayers(formData.home_team, 'home')
    if (formData.away_team) loadPlayers(formData.away_team, 'away')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, formData.home_team, formData.away_team])

  if (loading) return <Loading />

  const matchesList = Array.isArray(matches) ? matches : []
  const clubsList = Array.isArray(clubs) ? clubs : []
  const homeName = clubsList.find(c=>c.id.toString()===formData.home_team)?.name || 'Домашняя'
  const awayName = clubsList.find(c=>c.id.toString()===formData.away_team)?.name || 'Гостевая'

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление матчами</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">Добавить матч</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Дата</th>
                <th className="px-4 py-3 text-left">Домашняя</th>
                <th className="px-4 py-3 text-left">Гостевая</th>
                <th className="px-4 py-3 text-left">Счет</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Стадион</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {matchesList.length > 0 ? matchesList.map((match) => (
                <tr key={match.id} className="border-b border-white/10">
                  <td className="px-4 py-3">{match.date ? formatDate(match.date) : '-'}</td>
                  <td className="px-4 py-3 font-medium">{match.home_team?.name || 'Неизвестно'}</td>
                  <td className="px-4 py-3 font-medium">{match.away_team?.name || 'Неизвестно'}</td>
                  <td className="px-4 py-3">{match.home_score !== null && match.away_score !== null ? `${match.home_score} - ${match.away_score}` : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${match.status === 'finished' ? 'bg-green-500/20 text-green-400' : match.status === 'live' ? 'bg-red-500/20 text-red-400' : match.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400' : match.status === 'postponed' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-blue-500/20 text-blue-400'}`}>{match.status === 'finished' ? 'Завершен' : match.status === 'live' ? 'В прямом эфире' : match.status === 'cancelled' ? 'Отменен' : match.status === 'postponed' ? 'Перенесен' : 'Запланирован'}</span>
                  </td>
                  <td className="px-4 py-3">{(match as any).stadium || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(match)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(match.id)} className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-white/60">Матчи не найдены</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{editingMatch ? 'Редактировать матч' : 'Добавить матч'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Дата *</label>
                <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input w-full" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Время *</label>
                <input type="time" value={formData.time || ''} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="input w-full" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Домашняя команда *</label>
                <select value={formData.home_team} onChange={(e) => { setFormData({ ...formData, home_team: e.target.value }); loadPlayers(e.target.value, 'home') }} className="input w-full" required>
                  <option value="">Выберите домашнюю команду</option>
                  {Array.isArray(clubs) && clubs.map((club: any) => (<option key={club.id} value={club.id}>{club.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Гостевая команда *</label>
                <select value={formData.away_team} onChange={(e) => { setFormData({ ...formData, away_team: e.target.value }); loadPlayers(e.target.value, 'away') }} className="input w-full" required>
                  <option value="">Выберите гостевую команду</option>
                  {Array.isArray(clubs) && clubs.map((club: any) => (<option key={club.id} value={club.id}>{club.name}</option>))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Стадион (справочник) *</label>
                  <select value={formData.stadium_ref || ''} onChange={(e) => setFormData({ ...formData, stadium_ref: e.target.value })} className="input w-full" required>
                    <option value="">—</option>
                    {Array.isArray(stadiums) && stadiums.map((s:any) => (<option key={s.id} value={s.id}>{s.name}{s.city ? `, ${s.city}` : ''}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Стадион (текст)</label>
                  <input type="text" value={formData.stadium || ''} onChange={(e) => setFormData({ ...formData, stadium: e.target.value })} className="input w-full" placeholder="Например: Центральный стадион" />
                </div>
              </div>

              {(formData.status === 'live' || formData.status === 'finished') && (
                <div className="space-y-6 border-t border-white/10 pt-4">
                  <h3 className="text-lg font-semibold">События матча</h3>
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium">⚽ Голы</label>
                      <button type="button" onClick={() => addEvent('goals')} className="btn btn-outline text-sm px-3 py-1">+ Добавить гол</button>
                    </div>
                    <div className="grid grid-cols-5 gap-2 mb-2 text-xs text-white/60 px-1">
                      <div>Игрок</div><div>Минута</div><div>Команда</div><div>Ассист</div><div></div>
                    </div>
                    {formData.goals.map((goal) => (
                      <div key={goal.id} className="grid grid-cols-5 gap-2 mb-2 p-3 bg-white/5 rounded">
                        <select value={(goal as any).player_id} onChange={(e) => updateEvent('goals', goal.id, 'player_id', e.target.value)} className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm">
                          <option value="">Игрок</option>
                          {(goal.team === 'home' ? homePlayers : awayPlayers).map((p: any) => (<option key={p.id} value={p.id}>{p.number ? `#${p.number} ` : ''}{p.full_name}</option>))}
                        </select>
                        <input type="number" min="1" max="120" value={goal.minute} onChange={(e) => updateEvent('goals', goal.id, 'minute', parseInt(e.target.value) || 1)} className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm" />
                        <select value={goal.team} onChange={(e) => updateEvent('goals', goal.id, 'team', e.target.value)} className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm">
                          <option value="home">{homeName}</option>
                          <option value="away">{awayName}</option>
                        </select>
                        <select value={(goal as any).assist_player_id || ''} onChange={(e) => updateEvent('goals', goal.id, 'assist_player_id', e.target.value)} className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm">
                          <option value="">Ассист (необязательно)</option>
                          {(goal.team === 'home' ? homePlayers : awayPlayers).map((p: any) => (<option key={p.id} value={p.id}>{p.number ? `#${p.number} ` : ''}{p.full_name}</option>))}
                        </select>
                        <button type="button" onClick={() => removeEvent('goals', goal.id)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium">🟨 Желтые карточки</label>
                      <button type="button" onClick={() => addEvent('yellow_cards')} className="btn btn-outline text-sm px-3 py-1">+ Добавить карточку</button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-2 text-xs text-white/60 px-1">
                      <div>Игрок</div><div>Минута</div><div>Команда</div><div></div>
                    </div>
                    {formData.yellow_cards.map((card) => (
                      <div key={card.id} className="grid grid-cols-4 gap-2 mb-2 p-3 bg-white/5 rounded">
                        <select value={(card as any).player_id} onChange={(e) => updateEvent('yellow_cards', card.id, 'player_id', e.target.value)} className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm">
                          <option value="">Игрок</option>
                          {(card.team === 'home' ? homePlayers : awayPlayers).map((p: any) => (<option key={p.id} value={p.id}>{p.number ? `#${p.number} ` : ''}{p.full_name}</option>))}
                        </select>
                        <input type="number" min="1" max="120" value={card.minute} onChange={(e) => updateEvent('yellow_cards', card.id, 'minute', parseInt(e.target.value) || 1)} className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm" />
                        <select value={card.team} onChange={(e) => updateEvent('yellow_cards', card.id, 'team', e.target.value)} className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm">
                          <option value="home">{homeName}</option>
                          <option value="away">{awayName}</option>
                        </select>
                        <button type="button" onClick={() => removeEvent('yellow_cards', card.id)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
                      </div>
                    ))}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium">🟥 Красные карточки</label>
                      <button type="button" onClick={() => addEvent('red_cards')} className="btn btn-outline text-sm px-3 py-1">+ Добавить карточку</button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-2 text-xs text-white/60 px-1">
                      <div>Игрок</div><div>Минута</div><div>Команда</div><div></div>
                    </div>
                    {formData.red_cards.map((card) => (
                      <div key={card.id} className="grid grid-cols-4 gap-2 mb-2 p-3 bg-white/5 rounded">
                        <select value={(card as any).player_id} onChange={(e) => updateEvent('red_cards', card.id, 'player_id', e.target.value)} className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm">
                          <option value="">Игрок</option>
                          {(card.team === 'home' ? homePlayers : awayPlayers).map((p: any) => (<option key={p.id} value={p.id}>{p.number ? `#${p.number} ` : ''}{p.full_name}</option>))}
                        </select>
                        <input type="number" min="1" max="120" value={card.minute} onChange={(e) => updateEvent('red_cards', card.id, 'minute', parseInt(e.target.value) || 1)} className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm" />
                        <select value={card.team} onChange={(e) => updateEvent('red_cards', card.id, 'team', e.target.value)} className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm">
                          <option value="home">{homeName}</option>
                          <option value="away">{awayName}</option>
                        </select>
                        <button type="button" onClick={() => removeEvent('red_cards', card.id)} className="text-red-400 hover:text-red-300 text-sm">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button type="submit" className="btn btn-primary flex-1" disabled={mutationLoading}>{mutationLoading ? 'Сохранение...' : 'Сохранить'}</button>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingMatch(null); setFormData({ date: '', time: '', home_team: '', away_team: '', stadium: '', status: 'scheduled', home_score: undefined, away_score: undefined, goals: [], yellow_cards: [], red_cards: [] }) }} className="btn btn-outline flex-1">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 