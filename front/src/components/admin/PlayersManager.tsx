"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Player, Club } from '@/types'
import { Loading } from '@/components/Loading'

interface PlayerFormData {
  first_name: string
  last_name: string
  position: string
  nationality: string
  club: string
  date_of_birth: string
  photo?: File
  number?: number
  height?: number
  weight?: number
  bio?: string
}

export function PlayersManager() {
  const { data: players, loading, error, refetch } = useApi<Player[]>(API_ENDPOINTS.PLAYERS)
  const { data: clubs, loading: clubsLoading } = useApi<Club[]>(API_ENDPOINTS.CLUBS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [formData, setFormData] = useState<PlayerFormData>({
    first_name: '',
    last_name: '',
    position: '',
    nationality: '',
    club: '',
    date_of_birth: ''
  })

  const { mutate, loading: mutationLoading, error: mutationError } = useApiMutation<Player>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('first_name', formData.first_name)
      formDataToSend.append('last_name', formData.last_name)
      formDataToSend.append('position', formData.position)
      formDataToSend.append('nationality', formData.nationality)
      formDataToSend.append('club', formData.club)
      formDataToSend.append('date_of_birth', formData.date_of_birth)
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo)
      }
      if (formData.number) {
        formDataToSend.append('number', formData.number.toString())
      }
      if (formData.height) {
        formDataToSend.append('height', formData.height.toString())
      }
      if (formData.weight) {
        formDataToSend.append('weight', formData.weight.toString())
      }
      if (formData.bio) {
        formDataToSend.append('bio', formData.bio)
      }

      if (editingPlayer) {
        await mutate(API_ENDPOINTS.PLAYER_DETAIL(editingPlayer.id.toString()), 'PUT', formDataToSend)
      } else {
        await mutate(API_ENDPOINTS.PLAYERS, 'POST', formDataToSend)
      }

      setIsModalOpen(false)
      setEditingPlayer(null)
      setFormData({ first_name: '', last_name: '', position: '', nationality: '', club: '', date_of_birth: '' })
      
      setTimeout(() => {
        refetch()
      }, 500)
    } catch (error) {
      alert(`Ошибка при сохранении игрока: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }

  const handleEdit = (player: Player) => {
    setEditingPlayer(player)
    setFormData({
      first_name: player.first_name || '',
      last_name: player.last_name || '',
      position: player.position || '',
      nationality: player.nationality || '',
      club: player.club?.id ? player.club.id.toString() : '',
      date_of_birth: player.date_of_birth || '',
      number: player.number,
      height: player.height,
      weight: player.weight,
      bio: player.bio
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (playerId: string) => {
    if (confirm('Вы уверены, что хотите удалить этого игрока?')) {
      try {
        await mutate(API_ENDPOINTS.PLAYER_DETAIL(playerId), 'DELETE')
        refetch()
      } catch (error) {
        alert(`Ошибка при удалении игрока: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      }
    }
  }

  if (loading || clubsLoading) {
    return <Loading />
  }

  const playersList = Array.isArray(players) ? players : []
  const clubsList = Array.isArray(clubs) ? clubs : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление игроками</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          Добавить игрока
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Фото</th>
                <th className="px-4 py-3 text-left">Имя</th>
                <th className="px-4 py-3 text-left">Позиция</th>
                <th className="px-4 py-3 text-left">Клуб</th>
                <th className="px-4 py-3 text-left">Национальность</th>
                <th className="px-4 py-3 text-left">Дата рождения</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {playersList.length > 0 ? playersList.map((player) => (
                <tr key={player.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {player.photo ? (
                      <img src={player.photo} alt={player.first_name} className="w-8 h-8 rounded" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-500 rounded flex items-center justify-center text-xs">
                        {player.first_name?.[0]}{player.last_name?.[0]}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {player.first_name} {player.last_name}
                  </td>
                  <td className="px-4 py-3">{player.position}</td>
                  <td className="px-4 py-3">{player.club?.name || '-'}</td>
                  <td className="px-4 py-3">{player.nationality}</td>
                  <td className="px-4 py-3">
                    {player.date_of_birth ? new Date(player.date_of_birth).toLocaleDateString('ru-RU') : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(player)}
                        className="btn btn-outline px-3 py-1 text-sm"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(player.id)}
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
                    Игроки не найдены
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
          <div className="card p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingPlayer ? 'Редактировать игрока' : 'Добавить игрока'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Имя</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Фамилия</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Позиция</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  required
                >
                  <option value="">Выберите позицию</option>
                  <option value="Вратарь">Вратарь</option>
                  <option value="Защитник">Защитник</option>
                  <option value="Полузащитник">Полузащитник</option>
                  <option value="Нападающий">Нападающий</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Клуб</label>
                <select
                  value={formData.club}
                  onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  required
                >
                  <option value="">Выберите клуб</option>
                  {clubsList.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Национальность</label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Дата рождения</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  required
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Номер</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={formData.number || ''}
                    onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Рост (см)</label>
                  <input
                    type="number"
                    min="150"
                    max="220"
                    value={formData.height || ''}
                    onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Вес (кг)</label>
                  <input
                    type="number"
                    min="50"
                    max="120"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || undefined })}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Биография</label>
                <textarea
                  value={formData.bio || ''}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Фото</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                />
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
                    setEditingPlayer(null)
                    setFormData({ first_name: '', last_name: '', position: '', nationality: '', club: '', date_of_birth: '' })
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