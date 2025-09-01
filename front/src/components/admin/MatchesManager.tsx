"use client"
import { useState } from 'react'
import { useMatches } from '@/hooks/useMatches'
import { useClubs } from '@/hooks/useClubs'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Match, Club } from '@/types'
import { Loading } from '../Loading'
import { formatDate } from '@/utils'

interface MatchFormData {
  date: string
  home_team: string
  away_team: string
  stadium?: string
  status: 'scheduled' | 'live' | 'finished' | 'cancelled'
  home_score?: number
  away_score?: number
  // События матча
  goals: MatchEvent[]
  assists: MatchEvent[]
  yellow_cards: MatchEvent[]
  red_cards: MatchEvent[]
}

interface MatchEvent {
  id: string
  player_name: string
  minute: number
  team: 'home' | 'away'
  description?: string
}

export function MatchesManager() {
  const { matches, loading, refetch } = useMatches()
  const { clubs } = useClubs()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [formData, setFormData] = useState<MatchFormData>({
    date: '',
    home_team: '',
    away_team: '',
    stadium: '',
    status: 'scheduled',
    home_score: undefined,
    away_score: undefined,
    goals: [],
    assists: [],
    yellow_cards: [],
    red_cards: []
  })

  const { mutate, loading: mutationLoading, error } = useApiMutation<Match>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const stadiumValue = formData.stadium ? String(formData.stadium).trim() : ''
      
      let homeScore = null
      let awayScore = null
      
      if (formData.status === 'scheduled') {
        homeScore = null
        awayScore = null
      } else if (formData.status === 'finished') {
        homeScore = formData.home_score !== undefined && formData.home_score !== null ? formData.home_score : 0
        awayScore = formData.away_score !== undefined && formData.away_score !== null ? formData.away_score : 0
      } else {
        homeScore = formData.home_score || null
        awayScore = formData.away_score || null
      }
      
      const submitData = {
        ...formData,
        home_team: formData.home_team || null,
        away_team: formData.away_team || null,
        date: formData.date || null,
        stadium: stadiumValue,
        home_score: homeScore,
        away_score: awayScore
      }
      
      if (editingMatch) {
        await mutate(API_ENDPOINTS.MATCH_DETAIL(editingMatch.id.toString()), 'PUT', submitData)
      } else {
        await mutate(API_ENDPOINTS.MATCHES, 'POST', submitData)
      }
      
      setIsModalOpen(false)
      setEditingMatch(null)
      setFormData({
        date: '',
        home_team: '',
        away_team: '',
        stadium: '',
        status: 'scheduled',
        home_score: undefined,
        away_score: undefined,
        goals: [],
        assists: [],
        yellow_cards: [],
        red_cards: []
      })
      
      refetch()
    } catch (error) {
      console.error('Error saving match:', error)
      alert(`Ошибка при сохранении матча: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }

  const handleEdit = (match: Match) => {
    setEditingMatch(match)
    setFormData({
      date: match.date ? new Date(match.date).toISOString().split('T')[0] : '',
      home_team: match.home_team?.id ? match.home_team.id.toString() : '',
      away_team: match.away_team?.id ? match.away_team.id.toString() : '',
      stadium: match.stadium || '',
      status: match.status || 'scheduled',
      home_score: match.home_score || undefined,
      away_score: match.away_score || undefined,
      goals: [],
      assists: [],
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
        alert(`Ошибка при удалении матча: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      }
    }
  }

  // Функции для управления событиями матча
  const addEvent = (type: 'goals' | 'assists' | 'yellow_cards' | 'red_cards') => {
    const newEvent: MatchEvent = {
      id: Date.now().toString(),
      player_name: '',
      minute: 1,
      team: 'home',
      description: ''
    }
    setFormData({
      ...formData,
      [type]: [...formData[type], newEvent]
    })
  }

  const updateEvent = (type: 'goals' | 'assists' | 'yellow_cards' | 'red_cards', eventId: string, field: keyof MatchEvent, value: any) => {
    setFormData({
      ...formData,
      [type]: formData[type].map(event => 
        event.id === eventId ? { ...event, [field]: value } : event
      )
    })
  }

  const removeEvent = (type: 'goals' | 'assists' | 'yellow_cards' | 'red_cards', eventId: string) => {
    setFormData({
      ...formData,
      [type]: formData[type].filter(event => event.id !== eventId)
    })
  }

  if (loading) {
    return <Loading />
  }

  const matchesList = Array.isArray(matches) ? matches : []
  const clubsList = Array.isArray(clubs) ? clubs : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление матчами</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          Добавить матч
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Дата</th>
                <th className="px-4 py-3 text-left">Домашняя команда</th>
                <th className="px-4 py-3 text-left">Гостевая команда</th>
                <th className="px-4 py-3 text-left">Счет</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Стадион</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {matchesList.length > 0 ? matchesList.map((match) => (
                <tr key={match.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {match.date ? formatDate(match.date) : '-'}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {match.home_team?.name || 'Неизвестно'}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {match.away_team?.name || 'Неизвестно'}
                  </td>
                  <td className="px-4 py-3">
                    {match.home_score !== null && match.away_score !== null
                      ? `${match.home_score} - ${match.away_score}`
                      : '-'
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      match.status === 'finished' ? 'bg-green-500/20 text-green-400' :
                      match.status === 'live' ? 'bg-red-500/20 text-red-400' :
                      match.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {match.status === 'finished' ? 'Завершен' :
                       match.status === 'live' ? 'В прямом эфире' :
                       match.status === 'cancelled' ? 'Отменен' :
                       'Запланирован'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{match.stadium || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(match)}
                        className="btn btn-outline px-3 py-1 text-sm"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(match.id)}
                        className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
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
      </div>

      {/* Модальное окно для добавления/редактирования */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingMatch ? 'Редактировать матч' : 'Добавить матч'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Дата *</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  placeholder="Выберите дату матча"
                  required
                />

              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Домашняя команда *</label>
                                  <select
                    value={formData.home_team}
                    onChange={(e) => setFormData({ ...formData, home_team: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                    required
                  >
                    <option value="">Выберите домашнюю команду</option>
                    {clubsList.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>

              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Гостевая команда *</label>
                                  <select
                    value={formData.away_team}
                    onChange={(e) => setFormData({ ...formData, away_team: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                    required
                  >
                    <option value="">Выберите гостевую команду</option>
                    {clubsList.map((club) => (
                      <option key={club.id} value={club.id}>
                        {club.name}
                      </option>
                    ))}
                  </select>

              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Стадион</label>
                <input
                  type="text"
                  value={formData.stadium}
                  onChange={(e) => setFormData({ ...formData, stadium: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  placeholder="Например: Стадион им. Ленина, Центральный стадион"
                />

              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Статус *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  required
                >
                  <option value="scheduled">Запланирован - матч еще не начался</option>
                  <option value="live">В прямом эфире - матч идет сейчас</option>
                  <option value="finished">Завершен - матч закончился, нужен счет</option>
                  <option value="cancelled">Отменен - матч отменен</option>
                </select>

              </div>
              
              {/* Поля счета отображаются в зависимости от статуса */}
              {formData.status !== 'scheduled' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Счет домашней команды
                      {formData.status === 'finished' && <span className="text-red-400"> *</span>}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.home_score || ''}
                      onChange={(e) => setFormData({ ...formData, home_score: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                      placeholder={formData.status === 'finished' ? 'Обязательно' : '0'}
                      required={formData.status === 'finished'}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Счет гостевой команды
                      {formData.status === 'finished' && <span className="text-red-400"> *</span>}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.away_score || ''}
                      onChange={(e) => setFormData({ ...formData, away_score: parseInt(e.target.value) || undefined })}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                      placeholder={formData.status === 'finished' ? 'Обязательно' : '0'}
                      required={formData.status === 'finished'}
                    />
                  </div>
                </div>
              )}

              {/* События матча - только для live и finished матчей */}
              {(formData.status === 'live' || formData.status === 'finished') && (
                <div className="space-y-6 border-t border-white/10 pt-4">
                  <h3 className="text-lg font-semibold">События матча</h3>
                  
                  {/* Голы */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium">⚽ Голы</label>
                      <button
                        type="button"
                        onClick={() => addEvent('goals')}
                        className="btn btn-outline text-sm px-3 py-1"
                      >
                        + Добавить гол
                      </button>
                    </div>
                    {formData.goals.map((goal, index) => (
                      <div key={goal.id} className="grid grid-cols-4 gap-2 mb-2 p-3 bg-white/5 rounded">
                        <input
                          type="text"
                          placeholder="Игрок"
                          value={goal.player_name}
                          onChange={(e) => updateEvent('goals', goal.id, 'player_name', e.target.value)}
                          className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Минута"
                          min="1"
                          max="120"
                          value={goal.minute}
                          onChange={(e) => updateEvent('goals', goal.id, 'minute', parseInt(e.target.value) || 1)}
                          className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm"
                        />
                        <select
                          value={goal.team}
                          onChange={(e) => updateEvent('goals', goal.id, 'team', e.target.value)}
                          className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm"
                        >
                          <option value="home">Домашняя</option>
                          <option value="away">Гостевая</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeEvent('goals', goal.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Ассисты */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium">🎯 Ассисты</label>
                      <button
                        type="button"
                        onClick={() => addEvent('assists')}
                        className="btn btn-outline text-sm px-3 py-1"
                      >
                        + Добавить ассист
                      </button>
                    </div>
                    {formData.assists.map((assist, index) => (
                      <div key={assist.id} className="grid grid-cols-4 gap-2 mb-2 p-3 bg-white/5 rounded">
                        <input
                          type="text"
                          placeholder="Игрок"
                          value={assist.player_name}
                          onChange={(e) => updateEvent('assists', assist.id, 'player_name', e.target.value)}
                          className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Минута"
                          min="1"
                          max="120"
                          value={assist.minute}
                          onChange={(e) => updateEvent('assists', assist.id, 'minute', parseInt(e.target.value) || 1)}
                          className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm"
                        />
                        <select
                          value={assist.team}
                          onChange={(e) => updateEvent('assists', assist.id, 'team', e.target.value)}
                          className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm"
                        >
                          <option value="home">Домашняя</option>
                          <option value="away">Гостевая</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeEvent('assists', assist.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Желтые карточки */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium">🟨 Желтые карточки</label>
                      <button
                        type="button"
                        onClick={() => addEvent('yellow_cards')}
                        className="btn btn-outline text-sm px-3 py-1"
                      >
                        + Добавить карточку
                      </button>
                    </div>
                    {formData.yellow_cards.map((card, index) => (
                      <div key={card.id} className="grid grid-cols-4 gap-2 mb-2 p-3 bg-white/5 rounded">
                        <input
                          type="text"
                          placeholder="Игрок"
                          value={card.player_name}
                          onChange={(e) => updateEvent('yellow_cards', card.id, 'player_name', e.target.value)}
                          className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Минута"
                          min="1"
                          max="120"
                          value={card.minute}
                          onChange={(e) => updateEvent('yellow_cards', card.id, 'minute', parseInt(e.target.value) || 1)}
                          className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm"
                        />
                        <select
                          value={card.team}
                          onChange={(e) => updateEvent('yellow_cards', card.id, 'team', e.target.value)}
                          className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm"
                        >
                          <option value="home">Домашняя</option>
                          <option value="away">Гостевая</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeEvent('yellow_cards', card.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Красные карточки */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-medium">🟥 Красные карточки</label>
                      <button
                        type="button"
                        onClick={() => addEvent('red_cards')}
                        className="btn btn-outline text-sm px-3 py-1"
                      >
                        + Добавить карточку
                      </button>
                    </div>
                    {formData.red_cards.map((card, index) => (
                      <div key={card.id} className="grid grid-cols-4 gap-2 mb-2 p-3 bg-white/5 rounded">
                        <input
                          type="text"
                          placeholder="Игрок"
                          value={card.player_name}
                          onChange={(e) => updateEvent('red_cards', card.id, 'player_name', e.target.value)}
                          className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm"
                        />
                        <input
                          type="number"
                          placeholder="Минута"
                          min="1"
                          max="120"
                          value={card.minute}
                          onChange={(e) => updateEvent('red_cards', card.id, 'minute', parseInt(e.target.value) || 1)}
                          className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm"
                        />
                        <select
                          value={card.team}
                          onChange={(e) => updateEvent('red_cards', card.id, 'team', e.target.value)}
                          className="px-2 py-1 bg-white/10 border border-white/20 rounded text-sm"
                        >
                          <option value="home">Домашняя</option>
                          <option value="away">Гостевая</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeEvent('red_cards', card.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={mutationLoading}
                >
                  {mutationLoading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingMatch(null)
                    setFormData({
                      date: '',
                      home_team: '',
                      away_team: '',
                      stadium: '',
                      status: 'scheduled',
                      home_score: undefined,
                      away_score: undefined,
                      goals: [],
                      assists: [],
                      yellow_cards: [],
                      red_cards: []
                    })
                  }}
                  className="btn btn-outline flex-1"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 