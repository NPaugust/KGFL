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
import { useSeasonStore } from '@/store/useSeasonStore'
import { useApi } from '@/hooks/useApi'
import { Modal, ConfirmModal } from '../ui/Modal'

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
  goals: SimpleEvent[]
  assists: SimpleEvent[]
  yellow_cards: SimpleEvent[]
  red_cards: SimpleEvent[]
}

interface SimpleEvent { id: string; player_id: string; minute: number; team: 'home' | 'away' }

export function MatchesManager() {
  const { matches, loading, refetch } = useMatches()
  const { clubs } = useClubs()
  const { data: stadiums } = useApi<any[]>(API_ENDPOINTS.STADIUMS)
  const { data: allPlayers } = useApi<any[]>(API_ENDPOINTS.PLAYERS)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [homePlayers, setHomePlayers] = useState<any[]>([])
  const [awayPlayers, setAwayPlayers] = useState<any[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null)
  const [formData, setFormData] = useState<MatchFormData>({
    date: '',
    time: '',
    home_team: '',
    away_team: '',
    stadium: '',
    stadium_ref: '',
    status: 'scheduled',
    home_score: undefined,
    away_score: undefined,
    goals: [],
    assists: [],
    yellow_cards: [],
    red_cards: []
  })
  
  // Существующие события матча (из базы данных)
  const [existingEvents, setExistingEvents] = useState<{
    goals: any[],
    cards: any[],
    assists: any[],
    substitutions: any[]
  }>({
    goals: [],
    cards: [],
    assists: [],
    substitutions: []
  })
  
  // Состояние для показа/скрытия истории матча
  const [showHistory, setShowHistory] = useState(false)

  const { mutate, loading: mutationLoading, error } = useApiMutation<Match>()

  // Вычисляемые переменные для счета
  const baseHomeScore = formData.home_score !== undefined ? formData.home_score : (editingMatch ? (editingMatch as any).home_score || 0 : 0)
  const baseAwayScore = formData.away_score !== undefined ? formData.away_score : (editingMatch ? (editingMatch as any).away_score || 0 : 0)
  const computedHome = baseHomeScore + formData.goals.filter(g => g.team === 'home').length
  const computedAway = baseAwayScore + formData.goals.filter(g => g.team === 'away').length

  // Названия команд
  const homeName = clubs?.find((c: any) => c.id.toString() === formData.home_team)?.name || 'Домашняя команда'
  const awayName = clubs?.find((c: any) => c.id.toString() === formData.away_team)?.name || 'Гостевая команда'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      
      // Рассчитываем счет: если заданы home_score/away_score в форме, используем их; иначе базовый счет + новые голы
      let computedHome = formData.home_score !== undefined ? formData.home_score : (baseHomeScore + formData.goals.filter(g => g.team === 'home').length)
      let computedAway = formData.away_score !== undefined ? formData.away_score : (baseAwayScore + formData.goals.filter(g => g.team === 'away').length)

      const submitData = {
        home_team: formData.home_team || null,
        away_team: formData.away_team || null,
        date: formData.date || null,
        time: formData.time || null,
        stadium_ref: formData.stadium_ref || null,
        status: formData.status,
        home_score: formData.status === 'scheduled' ? null : computedHome,
        away_score: formData.status === 'scheduled' ? null : computedAway,
        season: useSeasonStore.getState().selectedSeasonId,
        // При создании нового матча включаем события в данные
        // При редактировании события обрабатываются отдельно
        ...(editingMatch ? {} : {
          goals: formData.goals,
          assists: formData.assists,
          yellow_cards: formData.yellow_cards,
          red_cards: formData.red_cards
        })
      }

      let savedMatch: any
      if (editingMatch) savedMatch = await mutate(API_ENDPOINTS.MATCH_DETAIL(editingMatch.id.toString()), 'PUT', submitData)
      else savedMatch = await mutate(API_ENDPOINTS.MATCHES, 'POST', submitData)

      const matchId = (savedMatch as any)?.id || editingMatch?.id?.toString()
      const homeTeamId = formData.home_team
      const awayTeamId = formData.away_team
      if (matchId) {
        // Создаем события только при РЕДАКТИРОВАНИИ существующего матча
        // При создании нового матча события создаются через MatchCreateSerializer._create_events
        if (editingMatch) {
          // При редактировании сначала получаем текущие события матча
          let currentGoals: any[] = []
          let currentCards: any[] = []
          
          try {
            const matchDetail = await apiClient.get(API_ENDPOINTS.MATCH_DETAIL(matchId)) as any
            currentGoals = matchDetail.goals || []
            currentCards = matchDetail.cards || []
          } catch (error) {
            console.error('Ошибка при загрузке событий матча:', error)
          }
          
          // Создаем только НОВЫЕ события (без ID или с temp_ ID)
          for (const goal of formData.goals) {
            if (goal.player_id && goal.minute && (!goal.id || goal.id.toString().startsWith('temp_'))) {
              try {
                await apiClient.post(`${API_ENDPOINTS.MATCH_DETAIL(matchId)}add_goal/`, {
                  scorer: goal.player_id,
                  team: goal.team === 'home' ? homeTeamId : awayTeamId,
                  minute: goal.minute
                })
              } catch (error) {
                console.error('Ошибка при добавлении гола:', error)
              }
            }
          }
          
          for (const assist of formData.assists) {
            if (assist.player_id && assist.minute && (!assist.id || assist.id.toString().startsWith('temp_'))) {
              try {
                await apiClient.post(`${API_ENDPOINTS.MATCH_DETAIL(matchId)}add_assist/`, {
                  player: assist.player_id,
                  team: assist.team === 'home' ? homeTeamId : awayTeamId,
                  minute: assist.minute
                })
              } catch (error) {
                console.error('Ошибка при добавлении ассиста:', error)
              }
            }
          }
          
          for (const card of [...formData.yellow_cards, ...formData.red_cards]) {
            if (card.player_id && card.minute && (!card.id || card.id.toString().startsWith('temp_'))) {
              try {
                await apiClient.post(`${API_ENDPOINTS.MATCH_DETAIL(matchId)}add_card/`, {
                  player: card.player_id,
                  team: card.team === 'home' ? homeTeamId : awayTeamId,
                  minute: card.minute,
                  card_type: formData.yellow_cards.includes(card) ? 'yellow' : 'red'
                })
              } catch (error) {
                console.error('Ошибка при добавлении карточки:', error)
              }
            }
          }
        }
      }

      // Отправляем событие для обновления всех компонентов
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { 
          type: 'match', 
          id: matchId,
          action: editingMatch ? 'updated' : 'created'
        } 
      }))
      
      setIsModalOpen(false)
      setEditingMatch(null)
      setExistingEvents({ goals: [], cards: [], assists: [], substitutions: [] })
      setFormData({ 
        date: '', 
        time: '', 
        home_team: '', 
        away_team: '', 
        stadium: '', 
        stadium_ref: '', 
        status: 'scheduled', 
        home_score: undefined, 
        away_score: undefined, 
        goals: [], 
        assists: [], 
        yellow_cards: [], 
        red_cards: [] 
      })
    } catch (error: any) {
      console.error('Ошибка при сохранении матча:', error)
      alert(`Ошибка при сохранении матча: ${error?.message || ''}`)
    }
  }

  const handleEdit = async (match: Match) => {
    setEditingMatch(match)
    
    // Сначала загружаем существующие события через API
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL
      const [goalsRes, cardsRes, assistsRes] = await Promise.all([
        fetch(`${baseUrl}/matches/${match.id}/goals/`),
        fetch(`${baseUrl}/matches/${match.id}/cards/`),
        fetch(`${baseUrl}/matches/${match.id}/assists/`).catch(() => ({ ok: false })) // Ассисты могут не существовать
      ])
      
      if (goalsRes.ok && cardsRes.ok) {
        const goals = await goalsRes.json()
        const cards = await cardsRes.json()
        const assists = assistsRes.ok ? await (assistsRes as Response).json() : []
        
        setExistingEvents({
          goals: goals || [],
          cards: cards || [],
          assists: assists || [],
          substitutions: [] // пока не загружаем замены
        })
        console.log('✅ Загружены события матча:', { goals, cards, assists })
      } else {
        console.error('❌ Ошибка при загрузке событий:', goalsRes.status, cardsRes.status)
        setExistingEvents({ goals: [], cards: [], assists: [], substitutions: [] })
      }
    } catch (error) {
      console.error('❌ Ошибка при загрузке событий матча:', error)
      setExistingEvents({ goals: [], cards: [], assists: [], substitutions: [] })
    }
    
    // Загружаем реальные события матча (из данных которые уже есть)
    const matchWithEvents = match as any
    const goals = (matchWithEvents.goals || []).map((goal: any) => ({
      id: goal.id || `temp_${Date.now()}`,
      player_id: goal.scorer?.id || goal.scorer || '',
      minute: goal.minute || 1,
      team: goal.team === match.home_team?.id ? 'home' : 'away'
    }))
    
    const cards = matchWithEvents.cards || []
    
    // Разделяем карточки на желтые и красные
    const yellow_cards = cards.filter((card: any) => card.card_type === 'yellow').map((card: any) => ({
      id: card.id || `temp_${Date.now()}`,
      player_id: card.player?.id || card.player || '',
      minute: card.minute || 1,
      team: card.team === match.home_team?.id ? 'home' : 'away'
    }))
    
    const red_cards = cards.filter((card: any) => card.card_type === 'red').map((card: any) => ({
      id: card.id || `temp_${Date.now()}`,
      player_id: card.player?.id || card.player || '',
      minute: card.minute || 1,
      team: card.team === match.home_team?.id ? 'home' : 'away'
    }))
    
    // Пока ассисты не реализованы в backend, используем пустой массив
    const assists: any[] = []
    
    const homeTeamId = match.home_team ? (typeof match.home_team === 'object' ? (match.home_team as any).id?.toString() || '' : String(match.home_team)) : ''
    const awayTeamId = match.away_team ? (typeof match.away_team === 'object' ? (match.away_team as any).id?.toString() || '' : String(match.away_team)) : ''
    
    setFormData({
      date: match.date || '',
      time: match.time || '',
      home_team: homeTeamId,
      away_team: awayTeamId,
      stadium: match.stadium || '',
      stadium_ref: (match as any).stadium_ref?.id?.toString() || (match as any).stadium_ref?.toString() || (match as any).stadium?.toString() || '',
      status: match.status || 'scheduled',
      home_score: match.home_score !== undefined ? match.home_score : undefined,
      away_score: match.away_score !== undefined ? match.away_score : undefined,
      goals: goals,
      assists: assists,
      yellow_cards: yellow_cards,
      red_cards: red_cards
    })
    
    // Загружаем игроков команд
    if (homeTeamId) loadPlayers(homeTeamId, 'home')
    if (awayTeamId) loadPlayers(awayTeamId, 'away')
    
    setIsModalOpen(true)
  }

  const handleDelete = (match: Match) => {
    setMatchToDelete(match)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!matchToDelete) return
    
    try {
      await apiClient.delete(API_ENDPOINTS.MATCH_DETAIL(matchToDelete.id))
      
      // Отправляем событие для обновления всех компонентов
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { 
          type: 'match', 
          id: matchToDelete.id,
          action: 'deleted'
        } 
      }))
      
      // Дополнительное событие для принудительного обновления статистики
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('data-refresh', { 
          detail: { 
            type: 'player_stats', 
            action: 'force_refresh'
          } 
        }))
        window.dispatchEvent(new CustomEvent('data-refresh', { 
          detail: { 
            type: 'club_stats', 
            action: 'force_refresh'
          } 
        }))
      }, 500)
      
      setDeleteModalOpen(false)
      setMatchToDelete(null)
    } catch (error: any) {
      console.error('Ошибка при удалении матча:', error)
      alert(`Ошибка при удалении матча: ${error?.message || ''}`)
    }
  }

  // Удаление существующих событий из истории матча (голы/карточки/ассисты)
  const deleteExistingEvent = async (type: 'goal' | 'card' | 'assist', event: any) => {
    try {
      if (!editingMatch) return
      
      // Простое удаление по ID события
      const eventId = event.id || event.goal_id || event.card_id || event.assist_id
      if (!eventId) {
        alert('Не удалось определить ID события для удаления')
        return
      }

      const urlPath = type === 'goal' ? `${process.env.NEXT_PUBLIC_API_URL}/goals/${eventId}/` : 
                     type === 'assist' ? `${process.env.NEXT_PUBLIC_API_URL}/assists/${eventId}/` : 
                     `${process.env.NEXT_PUBLIC_API_URL}/cards/${eventId}/`
      
      console.log('Удаляем событие:', urlPath, eventId)
      await fetch(urlPath, { method: 'DELETE' })
      console.log('Событие удалено успешно')

      // Обновляем локальное состояние сразу
      setExistingEvents(prev => ({
        ...prev,
        goals: type === 'goal' ? prev.goals.filter((g: any) => g.id !== eventId) : prev.goals,
        assists: type === 'assist' ? prev.assists.filter((a: any) => a.id !== eventId) : prev.assists,
        cards: type === 'card' ? prev.cards.filter((c: any) => c.id !== eventId) : prev.cards,
      }))

      // Обновляем матч для актуального счета
      if (editingMatch) {
        const matchDetail = await (apiClient as any).get(API_ENDPOINTS.MATCH_DETAIL(editingMatch.id.toString()))
        setEditingMatch(matchDetail as any)
      }

      // Уведомляем другие компоненты об обновлении
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { 
          type: 'match', 
          id: editingMatch?.id,
          action: 'event_deleted'
        } 
      }))
      
    } catch (error: any) {
      console.error('Ошибка при удалении события:', error)
      alert(`Ошибка при удалении события: ${error?.message || ''}`)
    }
  }

  const addEvent = (type: 'goals' | 'assists' | 'yellow_cards' | 'red_cards') => {
    // Проверяем, что выбраны команды
    if (!formData.home_team || !formData.away_team) {
      alert('Сначала выберите домашнюю и гостевую команды!')
      return
    }
    
    const base: any = { id: `temp_${Date.now()}`, player_id: '', minute: 1, team: 'home' }
    setFormData({ ...formData, [type]: [...formData[type], base] })
  }
  const updateEvent = (type: 'goals' | 'assists' | 'yellow_cards' | 'red_cards', eventId: string, field: string, value: any) => {
    setFormData({ ...formData, [type]: formData[type].map(event => event.id === eventId ? { ...event, [field]: value } : event) })
  }
  const removeEvent = (type: 'goals' | 'assists' | 'yellow_cards' | 'red_cards', eventId: string) => {
    setFormData({ ...formData, [type]: formData[type].filter(event => event.id !== eventId) })
  }

  const loadPlayers = (clubId: string, side: 'home'|'away') => {
    if (!clubId || !allPlayers) return
    
    // Фильтруем игроков по клубу из уже загруженных данных
    const clubPlayers = allPlayers.filter((player: any) => {
      return player.club?.toString() === clubId.toString()
    })
    
    if (side === 'home') {
      setHomePlayers(clubPlayers)
    } else {
      setAwayPlayers(clubPlayers)
    }
  }

  useEffect(() => {
    if (!isModalOpen) return
    if (formData.home_team) loadPlayers(formData.home_team, 'home')
    if (formData.away_team) loadPlayers(formData.away_team, 'away')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, formData.home_team, formData.away_team])

  // Загружаем игроков при изменении команд
  useEffect(() => {
    if (formData.home_team) loadPlayers(formData.home_team, 'home')
  }, [formData.home_team, loadPlayers])

  useEffect(() => {
    if (formData.away_team) loadPlayers(formData.away_team, 'away')
  }, [formData.away_team, loadPlayers])

  // Загружаем игроков когда allPlayers загрузится
  useEffect(() => {
    if (allPlayers && formData.home_team) loadPlayers(formData.home_team, 'home')
    if (allPlayers && formData.away_team) loadPlayers(formData.away_team, 'away')
  }, [allPlayers, formData.home_team, formData.away_team, loadPlayers])


  if (loading) return <Loading />

  const matchesList = Array.isArray(matches) ? matches : []
  const clubsList = Array.isArray(clubs) ? clubs : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление матчами</h1>
        <button onClick={() => {
          setEditingMatch(null)
          setExistingEvents({ goals: [], cards: [], assists: [], substitutions: [] }) // Сбрасываем события
          setFormData({ date: '', time: '', home_team: '', away_team: '', stadium: '', stadium_ref: '', status: 'scheduled', home_score: undefined, away_score: undefined, goals: [], assists: [], yellow_cards: [], red_cards: [] })
          setIsModalOpen(true)
        }} className="btn btn-primary">Добавить матч</button>
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
                <th className="px-4 py-3 text-left">Стадион</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {matchesList.map((match: any) => (
                <tr key={match.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{formatDate(match.date)} {match.time}</td>
                  <td className="px-4 py-3">{match.home_team_name}</td>
                  <td className="px-4 py-3">{match.away_team_name}</td>
                  <td className="px-4 py-3">{match.home_score !== null ? `${match.home_score} - ${match.away_score}` : '—'}</td>
                  <td className="px-4 py-3">
                    {(() => {
                      const stadiumId = (match as any).stadium_ref || (match as any).stadium
                      if (!stadiumId) return '-'
                      
                      // Если стадионы загружены, ищем по ID
                      if (Array.isArray(stadiums) && stadiums.length > 0) {
                        const stadium = stadiums.find((s: any) => s.id.toString() === stadiumId.toString())
                        if (stadium) {
                          return `${stadium.name}${stadium.city ? `, ${stadium.city}` : ''}`
                        }
                      }
                      
                      // Если стадион не найден, показываем ID
                      return `Стадион #${stadiumId}`
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      match.status === 'live' ? 'bg-red-500/20 text-red-400' :
                      match.status === 'finished' ? 'bg-green-500/20 text-green-400' :
                      match.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400' :
                      match.status === 'postponed' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {match.status === 'live' ? 'Матч идёт' :
                       match.status === 'finished' ? 'Завершён' :
                       match.status === 'cancelled' ? 'Отменён' :
                       match.status === 'postponed' ? 'Перенесён' :
                       'Запланирован'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(match)} className="btn btn-outline text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(match)} className="btn bg-red-500 hover:bg-red-600 text-white text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingMatch(null); 
          setExistingEvents({ goals: [], cards: [], assists: [], substitutions: [] });
          setFormData({ 
            date: '', 
            time: '', 
            home_team: '', 
            away_team: '', 
            stadium: '', 
            stadium_ref: '', 
            status: 'scheduled', 
            home_score: undefined, 
            away_score: undefined, 
            goals: [], 
            assists: [], 
            yellow_cards: [], 
            red_cards: [] 
          });
        }}
        title={editingMatch ? 'Редактировать матч' : 'Добавить матч'}
        size="xl"
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Дата *</label>
                  <input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="input w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Время *</label>
                  <input type="time" value={formData.time || ''} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="input w-full" required />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Домашняя команда *</label>
                  <select value={formData.home_team} onChange={(e) => { setFormData({ ...formData, home_team: e.target.value }); loadPlayers(e.target.value, 'home') }} className="input w-full" required>
                    <option value="">Выберите домашнюю команду</option>
                    {Array.isArray(clubs) && clubs.map((club: any) => (<option key={club.id} value={club.id.toString()}>{club.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Гостевая команда *</label>
                  <select value={formData.away_team} onChange={(e) => { setFormData({ ...formData, away_team: e.target.value }); loadPlayers(e.target.value, 'away') }} className="input w-full" required>
                    <option value="">Выберите гостевую команду</option>
                    {Array.isArray(clubs) && clubs.map((club: any) => (<option key={club.id} value={club.id.toString()}>{club.name}</option>))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Статус матча *</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="input w-full" required>
                    <option value="scheduled">Запланирован</option>
                    <option value="live">Матч идёт</option>
                    <option value="finished">Завершён</option>
                    <option value="cancelled">Отменён</option>
                    <option value="postponed">Перенесён</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Стадион *</label>
                  <select value={formData.stadium_ref || ''} onChange={(e) => setFormData({ ...formData, stadium_ref: e.target.value })} className="input w-full" required>
                    <option value="">—</option>
                    {Array.isArray(stadiums) && stadiums.map((s:any) => (
                      <option key={s.id} value={s.id}>{s.name}{s.city ? `, ${s.city}` : ''}</option>
                    ))}
                  </select>
                </div>
              </div>


              {(formData.status === 'live' || formData.status === 'finished') && (
                <div className="space-y-6 border-t border-gray-700 pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Управление событиями матча</h3>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{homeName} {computedHome} - {computedAway} {awayName}</div>
                      <div className="text-sm text-gray-400">Текущий счет</div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            if (!editingMatch) return
                            
                            // Просто сбрасываем счет на сервере - события удалятся автоматически через сигналы
                            await (apiClient as any).patch(API_ENDPOINTS.MATCH_DETAIL(editingMatch.id.toString()), {
                              home_score: 0,
                              away_score: 0
                            })
                            
                            // Сбрасываем локальное состояние
                            setFormData({ 
                              ...formData, 
                              goals: [], 
                              assists: [], 
                              yellow_cards: [], 
                              red_cards: [],
                              home_score: 0,
                              away_score: 0
                            })
                            
                            // Обновляем матч
                            const updatedMatch = await (apiClient as any).get(API_ENDPOINTS.MATCH_DETAIL(editingMatch.id.toString()))
                            setEditingMatch(updatedMatch as any)
                            
                            // Очищаем события
                            setExistingEvents({ goals: [], cards: [], assists: [], substitutions: [] })
                            
                            // Уведомляем об обновлении
                            window.dispatchEvent(new CustomEvent('data-refresh', { 
                              detail: { 
                                type: 'match', 
                                id: editingMatch?.id,
                                action: 'score_reset'
                              } 
                            }))
                            
                            alert('Счет сброшен')
                          } catch (error) {
                            console.error('Ошибка при сбросе счета:', error)
                            alert('Не удалось сбросить счет')
                          }
                        }}
                        className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                      >
                        Сбросить счет
                      </button>
                    </div>
                  </div>
                  
                  {/* Быстрые действия */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button 
                      type="button" 
                      onClick={() => addEvent('goals')} 
                      className="btn btn-primary flex items-center gap-1 px-3 py-2 text-sm"
                    >
                      <span className="font-bold">+</span>
                      <span>Гол</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => addEvent('assists')} 
                      className="btn btn-outline flex items-center gap-1 px-3 py-2 text-sm"
                    >
                      <span className="font-bold">+</span>
                      <span>Ассист</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => addEvent('yellow_cards')} 
                      className="btn bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-1 px-3 py-2 text-sm"
                    >
                      <span className="font-bold">+</span>
                      <span>Желтая</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => addEvent('red_cards')} 
                      className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 px-3 py-2 text-sm"
                    >
                      <span className="font-bold">+</span>
                      <span>Красная</span>
                    </button>
                  </div>


                  {/* Список событий */}
                  <div className="space-y-4">
                    {/* История матча (выдвижная) */}
                    {editingMatch && showHistory && (existingEvents.goals.length > 0 || existingEvents.cards.length > 0 || existingEvents.assists.length > 0) && (
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-blue-400"> События из истории матча</h3>
                          <button
                            type="button"
                            onClick={() => setShowHistory(false)}
                            className="text-gray-400 hover:text-white transition-colors"
                            title="Скрыть историю"
                          >
                            ✕
                          </button>
                        </div>
                        
                        {/* Существующие голы */}
                        {existingEvents.goals.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-md font-medium text-green-400 mb-2"> Голы ({existingEvents.goals.length})</h4>
                            {existingEvents.goals.map((goal: any, index: number) => (
                              <div key={goal.id} className="flex items-center gap-3 p-3 bg-green-900/20 rounded border border-green-500/30 mb-2">
                                <div className="text-green-400 font-bold">#{index + 1}</div>
                                <div className="flex-1">
                                  <div className="font-semibold text-white">
                                    {goal.scorer_name || 'Неизвестный игрок'}
                                  </div>
                                  {goal.assist_name && (
                                    <div className="text-sm text-gray-400">
                                      Ассист: {goal.assist_name}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500">
                                    Команда: {goal.team_name}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-green-400">{goal.minute}&apos;</div>
                                  <div className="text-xs text-gray-500">мин</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => deleteExistingEvent('goal', goal)}
                                  className="ml-2 text-red-400 hover:text-red-300"
                                  title="Удалить гол"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Существующие ассисты */}
                        {existingEvents.assists.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-md font-medium text-blue-400 mb-2"> Ассисты ({existingEvents.assists.length})</h4>
                            {existingEvents.assists.map((assist: any, index: number) => (
                              <div key={assist.id} className="flex items-center gap-3 p-3 bg-blue-900/20 rounded border border-blue-500/30 mb-2">
                                <div className="text-blue-400 font-bold">#{index + 1}</div>
                                <div className="flex-1">
                                  <div className="font-semibold text-white">
                                    {assist.player_name || 'Неизвестный игрок'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Команда: {assist.team_name}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className="text-lg font-bold text-blue-400">{assist.minute}&apos;</div>
                                  <div className="text-xs text-gray-500">мин</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => deleteExistingEvent('assist', assist)}
                                  className="ml-2 text-red-400 hover:text-red-300"
                                  title="Удалить ассист"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Существующие карточки */}
                        {existingEvents.cards.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-md font-medium text-yellow-400 mb-2">🟨🟥 Карточки ({existingEvents.cards.length})</h4>
                            {existingEvents.cards.map((card: any, index: number) => (
                              <div key={card.id} className="flex items-center gap-3 p-3 bg-yellow-900/20 rounded border border-yellow-500/30 mb-2">
                                <div className={card.card_type === 'yellow' ? 'text-yellow-400 text-xl' : 'text-red-400 text-xl'}>
                                  {card.card_type === 'yellow' ? '🟨' : '🟥'}
                                </div>
                                <div className="flex-1">
                                  <div className="font-semibold text-white">
                                    {card.player_name || 'Неизвестный игрок'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Команда: {card.team_name}
                                  </div>
                                </div>
                                <div className="text-center">
                                  <div className={`text-lg font-bold ${card.card_type === 'yellow' ? 'text-yellow-400' : 'text-red-400'}`}>
                                    {card.minute}&apos;
                                  </div>
                                  <div className="text-xs text-gray-500">мин</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => deleteExistingEvent('card', card)}
                                  className="ml-2 text-red-400 hover:text-red-300"
                                  title="Удалить карточку"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Новые голы (из формы) */}
                    {formData.goals.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-lg font-medium text-green-400">➕ Новые голы ({formData.goals.length})</h4>
                        {formData.goals.map((goal, index) => (
                          <div key={goal.id} className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                            <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <select
                              value={goal.player_id}
                              onChange={(e) => updateEvent('goals', goal.id, 'player_id', e.target.value)}
                              className="input flex-1"
                            >
                              <option value="">Выберите игрока</option>
                              {(goal.team === 'home' ? homePlayers : awayPlayers).map((player: any) => (
                                <option key={player.id} value={player.id}>
                                  {player.first_name} {player.last_name} (#{player.number || 'N/A'})
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={goal.minute}
                              onChange={(e) => updateEvent('goals', goal.id, 'minute', parseInt(e.target.value))}
                              placeholder="Минута (1-120)"
                              className="input w-24 text-center"
                              min="1"
                              max="120"
                              title="Введите минуту матча (1-120)"
                            />
                            <select
                              value={goal.team}
                              onChange={(e) => updateEvent('goals', goal.id, 'team', e.target.value)}
                              className="input w-40"
                            >
                              <option value="home">{homeName}</option>
                              <option value="away">{awayName}</option>
                            </select>
                            <button 
                              type="button" 
                              onClick={() => removeEvent('goals', goal.id)} 
                              className="btn bg-red-600 hover:bg-red-700 text-white px-3 py-2"
                            >
                              Удалить
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ассисты */}
                    {formData.assists.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-lg font-medium text-blue-400">➕ Новые ассисты ({formData.assists.length})</h4>
                        {formData.assists.map((assist, index) => (
                          <div key={assist.id} className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <select
                              value={assist.player_id}
                              onChange={(e) => updateEvent('assists', assist.id, 'player_id', e.target.value)}
                              className="input flex-1"
                            >
                              <option value="">Выберите игрока</option>
                              {(assist.team === 'home' ? homePlayers : awayPlayers).map((player: any) => (
                                <option key={player.id} value={player.id}>
                                  {player.first_name} {player.last_name} (#{player.number || 'N/A'})
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={assist.minute}
                              onChange={(e) => updateEvent('assists', assist.id, 'minute', parseInt(e.target.value))}
                              placeholder="Минута (1-120)"
                              className="input w-24 text-center"
                              min="1"
                              max="120"
                              title="Введите минуту матча (1-120)"
                            />
                            <select
                              value={assist.team}
                              onChange={(e) => updateEvent('assists', assist.id, 'team', e.target.value)}
                              className="input w-40"
                            >
                              <option value="home">{homeName}</option>
                              <option value="away">{awayName}</option>
                            </select>
                            <button 
                              type="button" 
                              onClick={() => removeEvent('assists', assist.id)} 
                              className="btn bg-red-600 hover:bg-red-700 text-white px-3 py-2"
                            >
                              Удалить
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Желтые карточки */}
                    {formData.yellow_cards.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-lg font-medium text-yellow-400">➕ Новые желтые карточки ({formData.yellow_cards.length})</h4>
                        {formData.yellow_cards.map((card, index) => (
                          <div key={card.id} className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                            <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <select
                              value={card.player_id}
                              onChange={(e) => updateEvent('yellow_cards', card.id, 'player_id', e.target.value)}
                              className="input flex-1"
                            >
                              <option value="">Выберите игрока</option>
                              {(card.team === 'home' ? homePlayers : awayPlayers).map((player: any) => (
                                <option key={player.id} value={player.id}>
                                  {player.first_name} {player.last_name} (#{player.number || 'N/A'})
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={card.minute}
                              onChange={(e) => updateEvent('yellow_cards', card.id, 'minute', parseInt(e.target.value))}
                              placeholder="Минута (1-120)"
                              className="input w-24 text-center"
                              min="1"
                              max="120"
                              title="Введите минуту матча (1-120)"
                            />
                            <select
                              value={card.team}
                              onChange={(e) => updateEvent('yellow_cards', card.id, 'team', e.target.value)}
                              className="input w-40"
                            >
                              <option value="home">{homeName}</option>
                              <option value="away">{awayName}</option>
                            </select>
                            <button 
                              type="button" 
                              onClick={() => removeEvent('yellow_cards', card.id)} 
                              className="btn bg-red-600 hover:bg-red-700 text-white px-3 py-2"
                            >
                              Удалить
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Красные карточки */}
                    {formData.red_cards.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-lg font-medium text-red-400">➕ Новые красные карточки ({formData.red_cards.length})</h4>
                        {formData.red_cards.map((card, index) => (
                          <div key={card.id} className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                              {index + 1}
                            </div>
                            <select
                              value={card.player_id}
                              onChange={(e) => updateEvent('red_cards', card.id, 'player_id', e.target.value)}
                              className="input flex-1"
                            >
                              <option value="">Выберите игрока</option>
                              {(card.team === 'home' ? homePlayers : awayPlayers).map((player: any) => (
                                <option key={player.id} value={player.id}>
                                  {player.first_name} {player.last_name} (#{player.number || 'N/A'})
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={card.minute}
                              onChange={(e) => updateEvent('red_cards', card.id, 'minute', parseInt(e.target.value))}
                              placeholder="Минута (1-120)"
                              className="input w-24 text-center"
                              min="1"
                              max="120"
                              title="Введите минуту матча (1-120)"
                            />
                            <select
                              value={card.team}
                              onChange={(e) => updateEvent('red_cards', card.id, 'team', e.target.value)}
                              className="input w-40"
                            >
                              <option value="home">{homeName}</option>
                              <option value="away">{awayName}</option>
                            </select>
                            <button 
                              type="button" 
                              onClick={() => removeEvent('red_cards', card.id)} 
                              className="btn bg-red-600 hover:bg-red-700 text-white px-3 py-2"
                            >
                              Удалить
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Кнопка истории событий - всегда видна если есть история */}
                    {editingMatch && (existingEvents.goals.length > 0 || existingEvents.cards.length > 0 || existingEvents.assists.length > 0) && (
                      <div className="text-center py-4">
                        <button
                          type="button"
                          onClick={() => setShowHistory(!showHistory)}
                          className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 mx-auto"
                        >
                          История матча ({existingEvents.goals.length + existingEvents.cards.length + existingEvents.assists.length} событий)
                          <span className={`transition-transform ${showHistory ? 'rotate-180' : ''}`}>▼</span>
                        </button>
                      </div>
                    )}

                    {/* Пустое состояние */}
                    {formData.goals.length === 0 && formData.assists.length === 0 && formData.yellow_cards.length === 0 && formData.red_cards.length === 0 && (
                      <div className="text-center py-8 text-gray-400">
                        <div className="text-lg mb-2">События матча</div>
                        <div className="text-sm">Используйте кнопки выше для добавления событий</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn btn-primary flex-1" disabled={mutationLoading}>{mutationLoading ? 'Сохранение...' : 'Сохранить'}</button>
              <button type="button" onClick={() => { 
                setIsModalOpen(false); 
                setEditingMatch(null); 
                setExistingEvents({ goals: [], cards: [], assists: [], substitutions: [] });
                setFormData({ 
                  date: '', 
                  time: '', 
                  home_team: '', 
                  away_team: '', 
                  stadium: '', 
                  stadium_ref: '', 
                  status: 'scheduled', 
                  home_score: undefined, 
                  away_score: undefined, 
                  goals: [], 
                  assists: [], 
                  yellow_cards: [], 
                  red_cards: [] 
                });
              }} className="btn btn-outline flex-1">Отмена</button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setMatchToDelete(null) }}
        onConfirm={confirmDelete}
        title="Подтверждение удаления"
        message={`Вы действительно хотите удалить матч ${matchToDelete?.home_team_name} vs ${matchToDelete?.away_team_name}?`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
        confirmFirst={true}
      />
    </div>
  )
}