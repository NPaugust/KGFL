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
    away_score: undefined
  })

  const { mutate, loading: mutationLoading, error } = useApiMutation<Match>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const submitData = {
        ...formData,
        home_team: formData.home_team || null,
        away_team: formData.away_team || null,
        date: formData.date || null,
        stadium: formData.stadium || '',
        home_score: formData.home_score || null,
        away_score: formData.away_score || null
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
        away_score: undefined
      })
      
      setTimeout(() => {
        refetch()
      }, 500)
    } catch (error) {
      alert(`Ошибка при сохранении матча: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }

  const handleEdit = (match: Match) => {
    setEditingMatch(match)
    setFormData({
      date: match.date || '',
      home_team: match.home_team?.id ? match.home_team.id.toString() : '',
      away_team: match.away_team?.id ? match.away_team.id.toString() : '',
      stadium: match.stadium || '',
      status: match.status || 'scheduled',
      home_score: match.home_score,
      away_score: match.away_score
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
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingMatch ? 'Редактировать матч' : 'Добавить матч'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Дата</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Домашняя команда</label>
                <select
                  value={formData.home_team}
                  onChange={(e) => setFormData({ ...formData, home_team: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  required
                >
                  <option value="">Выберите команду</option>
                  {clubsList.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Гостевая команда</label>
                <select
                  value={formData.away_team}
                  onChange={(e) => setFormData({ ...formData, away_team: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  required
                >
                  <option value="">Выберите команду</option>
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
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Статус</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  required
                >
                  <option value="scheduled">Запланирован</option>
                  <option value="live">В прямом эфире</option>
                  <option value="finished">Завершен</option>
                  <option value="cancelled">Отменен</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Счет домашней команды</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.home_score || ''}
                    onChange={(e) => setFormData({ ...formData, home_score: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Счет гостевой команды</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.away_score || ''}
                    onChange={(e) => setFormData({ ...formData, away_score: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  />
                </div>
              </div>
              
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
                      away_score: undefined
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