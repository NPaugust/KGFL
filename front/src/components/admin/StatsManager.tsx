"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import { Modal } from '../ui/Modal'

interface PlayerStatsFormData {
  player: string
  season: string
  games_played: number
  goals_scored: number
  assists: number
  yellow_cards: number
  red_cards: number
  minutes_played: number
}

export function StatsManager() {
  const { data: players, loading, refetch } = useApi(API_ENDPOINTS.PLAYERS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingStats, setEditingStats] = useState<any>(null)
  const [formData, setFormData] = useState<PlayerStatsFormData>({
    player: '',
    season: '2024',
    games_played: 0,
    goals_scored: 0,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
    minutes_played: 0
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const updatePlayerMutation = useApiMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setFormError(null)
      setFormSuccess(null)
      const statsData = {
        ...editingStats,
        games_played: formData.games_played,
        goals_scored: formData.goals_scored,
        assists: formData.assists,
        yellow_cards: formData.yellow_cards,
        red_cards: formData.red_cards,
        minutes_played: formData.minutes_played
      }

      await updatePlayerMutation.mutateAsync(API_ENDPOINTS.PLAYER_DETAIL(editingStats.id), 'PUT', statsData)

      setIsModalOpen(false)
      setEditingStats(null)
      
      // Сбрасываем formData только при создании новой статистики
      if (!editingStats) {
        setFormData({
          player: '',
          season: '2024',
          games_played: 0,
          goals_scored: 0,
          assists: 0,
          yellow_cards: 0,
          red_cards: 0,
          minutes_played: 0
        })
      }
      
      refetch()
      setFormSuccess('Сохранено')
      
      // Отправляем событие обновления данных
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { type: 'player_stats' } 
      }))
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || (error instanceof Error ? error.message : 'Неизвестная ошибка')
      setFormError(errorMessage)
    }
  }

  const handleEdit = (player: any) => {
    setEditingStats(player)
    setFormData({
      player: player.id,
      season: player.season || '2024',
      games_played: player.games_played || 0,
      goals_scored: player.goals_scored || 0,
      assists: player.assists || 0,
      yellow_cards: player.yellow_cards || 0,
      red_cards: player.red_cards || 0,
      minutes_played: player.minutes_played || 0
    })
    setIsModalOpen(true)
  }

  if (loading) {
    return <Loading />
  }

  const playersList = Array.isArray(players) ? players : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление статистикой игроков</h1>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Игрок</th>
                <th className="px-4 py-3 text-left">Клуб</th>
                <th className="px-4 py-3 text-left">Игры</th>
                <th className="px-4 py-3 text-left">Голы</th>
                <th className="px-4 py-3 text-left">Передачи</th>
                <th className="px-4 py-3 text-left">Желтые карточки</th>
                <th className="px-4 py-3 text-left">Красные карточки</th>
                <th className="px-4 py-3 text-left">Минуты</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {playersList.length > 0 ? playersList.map((player) => (
                <tr key={player.id} className="border-b border-white/10">
                  <td className="px-4 py-3 font-medium">
                    {player.first_name} {player.last_name}
                  </td>
                  <td className="px-4 py-3">{player.club?.name || '-'}</td>
                  <td className="px-4 py-3">{player.games_played || 0}</td>
                  <td className="px-4 py-3">{player.goals_scored || 0}</td>
                  <td className="px-4 py-3">{player.assists || 0}</td>
                  <td className="px-4 py-3">{player.yellow_cards || 0}</td>
                  <td className="px-4 py-3">{player.red_cards || 0}</td>
                  <td className="px-4 py-3">{player.minutes_played || 0}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleEdit(player)}
                      className="btn btn-outline px-3 py-1 text-sm"
                    >
                      Редактировать
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-white/60">
                    Игроки не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen && !!editingStats}
        onClose={() => { setIsModalOpen(false); setEditingStats(null); }}
        title="Редактировать статистику игрока"
        size="md"
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="text-red-400 text-sm">{formError}</div>
              )}
              {formSuccess && (
                <div className="text-green-400 text-sm">{formSuccess}</div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Игрок</label>
                <input
                  type="text"
                  value={`${editingStats.first_name} ${editingStats.last_name}`}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  disabled
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Игры</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.games_played}
                    onChange={(e) => setFormData({ ...formData, games_played: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Голы</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.goals_scored}
                    onChange={(e) => setFormData({ ...formData, goals_scored: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Передачи</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.assists}
                    onChange={(e) => setFormData({ ...formData, assists: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Минуты</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.minutes_played}
                    onChange={(e) => setFormData({ ...formData, minutes_played: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Желтые карточки</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.yellow_cards}
                    onChange={(e) => setFormData({ ...formData, yellow_cards: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Красные карточки</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.red_cards}
                    onChange={(e) => setFormData({ ...formData, red_cards: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                    required
                  />
                </div>
              </div>
              
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={updatePlayerMutation.loading}
              >
                {updatePlayerMutation.loading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingStats(null)
                }}
                className="btn btn-outline flex-1"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
} 