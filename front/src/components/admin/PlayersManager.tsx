"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Player, Club, PlayerTransfer } from '@/types'
import { Loading } from '@/components/Loading'
import { useSeasonStore } from '@/store/useSeasonStore'
import Image from 'next/image'
import { getImageUrl } from '@/utils'
import { Modal, ConfirmModal } from '../ui/Modal'

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
  phone?: string
  notes?: string
  status?: 'applied' | 'active' | 'injured' | 'disqualified' | 'loan' | 'withdrawn'
}

const positionMap = {
  GK: 'Вратарь',
  DF: 'Защитник',
  MF: 'Полузащитник',
  FW: 'Нападающий',
};

const statusMap = {
  applied: 'Заявлен',
  active: 'Активен',
  injured: 'Травма',
  disqualified: 'Дисквалификация',
  loan: 'Аренда',
  withdrawn: 'Выбыл',
};

export function PlayersManager() {
  const { data: players, loading, error, refetch } = useApi<Player[]>(API_ENDPOINTS.PLAYERS)
  const { data: clubs, loading: clubsLoading } = useApi<Club[]>(`${API_ENDPOINTS.CLUBS}?all=1`)
  const { data: transfers, refetch: refetchTransfers } = useApi<PlayerTransfer[]>(API_ENDPOINTS.PLAYER_TRANSFERS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)
  const selectedSeasonId = useSeasonStore(s => s.selectedSeasonId)
  const [formData, setFormData] = useState<PlayerFormData>({
    first_name: '',
    last_name: '',
    position: 'GK',
    nationality: '',
    club: '',
    date_of_birth: '',
    number: undefined,
    height: undefined,
    weight: undefined,
    phone: '',
    notes: '',
    status: 'applied'
  })

  const { mutate, loading: mutationLoading, error: mutationError } = useApiMutation<Player>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('first_name', formData.first_name)
      formDataToSend.append('last_name', formData.last_name)
      formDataToSend.append('position', formData.position)
      formDataToSend.append('nationality', formData.nationality || '')
      // Для пустого клуба отправляем пустую строку, бэкенд конвертирует в null
      formDataToSend.append('club', formData.club || '')
      formDataToSend.append('date_of_birth', formData.date_of_birth)
      
      // Фото необязательно - добавляем только если выбрано
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo)
      }
      
      // Номер обязателен
      if (!formData.number) {
        alert('Номер игрока обязателен')
        return
      }
      
      formDataToSend.append('number', String(formData.number))
      formDataToSend.append('height', formData.height ? String(formData.height) : '')
      formDataToSend.append('weight', formData.weight ? String(formData.weight) : '')
      formDataToSend.append('phone', formData.phone || '')
      formDataToSend.append('notes', formData.notes || '')
      formDataToSend.append('status', formData.status || 'applied')
      if (selectedSeasonId) formDataToSend.append('season', selectedSeasonId)

      if (editingPlayer) {
        await mutate(API_ENDPOINTS.PLAYER_DETAIL(editingPlayer.id.toString()), 'PATCH', formDataToSend)
      } else {
        await mutate(API_ENDPOINTS.PLAYERS, 'POST', formDataToSend)
      }

      setIsModalOpen(false)
      setEditingPlayer(null)
      
      // Сбрасываем formData только при создании нового игрока
      if (!editingPlayer) {
        setFormData({ 
          first_name: '', last_name: '', position: 'GK', nationality: '', 
          club: '', date_of_birth: '', number: undefined, height: undefined, 
          weight: undefined, phone: '', notes: '', status: 'applied' 
        })
      }
      refetch()
      
      // Принудительно обновляем связанные данные
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('data-refresh', { 
          detail: { 
            type: 'player', 
            id: editingPlayer?.id || 'new',
            action: editingPlayer ? 'updated' : 'created'
          } 
        }))
        // Дополнительное обновление для статистики
        window.dispatchEvent(new CustomEvent('data-refresh', { 
          detail: { type: 'player_stats' } 
        }))
      }, 100)
    } catch (error: any) {
      console.error('Ошибка при сохранении игрока:', error)
      const backend = error?.response?.data
      const msg = typeof backend === 'string' ? backend : JSON.stringify(backend)
      alert(`Ошибка при сохранении игрока: ${error?.message || ''}\n${msg || ''}`)
    }
  }

  const handleCreateClick = () => {
    setEditingPlayer(null)
    // Принудительно сбрасываем все данные формы
    setFormData({
      first_name: '',
      last_name: '',
      position: 'GK',
      nationality: '',
      club: '',
      date_of_birth: '',
      number: undefined,
      height: undefined,
      weight: undefined,
      phone: '',
      notes: '',
      status: 'applied',
      photo: undefined
    })
    setIsModalOpen(true)
  }

  const handleEdit = (player: Player) => {
    setEditingPlayer(player)
    setFormData({
      first_name: player.first_name || '',
      last_name: player.last_name || '',
      position: player.position || 'GK',
      nationality: player.nationality || '',
      // Поддержка варианта, когда в player.club приходит объект или только id
      club: player.club ? (typeof player.club === 'object' ? (player.club.id?.toString() || '') : String(player.club)) : '',
      date_of_birth: player.date_of_birth ? new Date(player.date_of_birth).toISOString().split('T')[0] : '',
      number: player.number,
      height: player.height,
      weight: player.weight,
      phone: player.phone || '',
      notes: player.notes || '',
      status: player.status || 'applied',
      photo: undefined, // Файл не префиллим при редактировании
    })
    setIsModalOpen(true)
  }

  const handleDelete = (player: Player) => {
    setPlayerToDelete(player)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!playerToDelete) return
    
    try {
      await mutate(API_ENDPOINTS.PLAYER_DETAIL(playerToDelete.id), 'DELETE')
      refetch()
      setDeleteModalOpen(false)
      setPlayerToDelete(null)
    } catch (error: any) {
      alert(`Ошибка при удалении игрока: ${error?.response?.data?.detail || error?.message || 'Неизвестная ошибка'}`)
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
        <button onClick={handleCreateClick} className="btn btn-primary">Добавить игрока</button>
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
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {playersList.length > 0 ? playersList.map((player) => (
                <tr key={player.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {((player as any).photo_url || player.photo) ? (
                      <Image 
                        src={(player as any).photo_url || getImageUrl(player.photo || '')} 
                        alt={player.first_name} 
                            width={48} 
                            height={48} 
                            className="w-12 h-12 rounded object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-white/5 rounded flex items-center justify-center border border-white/10">
                        <Image
                          src="/images/player-silhouette.svg"
                          alt="Player silhouette"
                          width={32}
                          height={32}
                          className="opacity-40"
                        />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{player.first_name} {player.last_name}</td>
                  <td className="px-4 py-3">{positionMap[player.position as keyof typeof positionMap] || player.position}</td>
                  <td className="px-4 py-3">{(player as any).club_name || player.club?.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      player.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {statusMap[player.status as keyof typeof statusMap] || player.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(player)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(player)} className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/60">Игроки не найдены</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPlayer(null); }}
        title={editingPlayer ? 'Редактировать игрока' : 'Добавить игрока'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90 mb-2">Имя *</label>
              <input 
                type="text" 
                value={formData.first_name} 
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} 
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-brand-primary/50 focus:bg-white/10 transition-all duration-200" 
                placeholder="Введите имя"
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90 mb-2">Фамилия *</label>
              <input 
                type="text" 
                value={formData.last_name} 
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} 
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-brand-primary/50 focus:bg-white/10 transition-all duration-200" 
                placeholder="Введите фамилию"
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90 mb-2">Позиция *</label>
              <select 
                value={formData.position} 
                onChange={(e) => setFormData({ ...formData, position: e.target.value })} 
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-brand-primary/50 focus:bg-white/10 transition-all duration-200" 
                required
              >
                <option value="" className="bg-gray-800 text-white">Выберите позицию</option>
                {Object.entries(positionMap).map(([key, value]) => (
                  <option key={key} value={key} className="bg-gray-800 text-white">{value}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90 mb-2">Клуб</label>
              <select 
                value={formData.club} 
                onChange={(e) => setFormData({ ...formData, club: e.target.value })} 
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-brand-primary/50 focus:bg-white/10 transition-all duration-200"
              >
                <option value="" className="bg-gray-800 text-white">Выберите клуб</option>
                {clubsList.map((club) => (
                  <option key={club.id} value={club.id.toString()} className="bg-gray-800 text-white">{club.name}</option>
                ))}
              </select>
                </div>
              </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90 mb-2">Национальность</label>
              <input 
                type="text" 
                value={formData.nationality} 
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} 
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-brand-primary/50 focus:bg-white/10 transition-all duration-200" 
                placeholder="Кыргызстан"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90 mb-2">Дата рождения *</label>
              <input 
                type="date" 
                value={formData.date_of_birth} 
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })} 
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-brand-primary/50 focus:bg-white/10 transition-all duration-200" 
                required 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90 mb-2">Номер *</label>
              <input 
                type="number" 
                min="1" 
                max="99" 
                value={formData.number || ''} 
                onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || undefined })} 
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-brand-primary/50 focus:bg-white/10 transition-all duration-200" 
                placeholder="1-99"
                required 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90 mb-2">Рост (см)</label>
              <input 
                type="number" 
                min="100" 
                max="250" 
                value={formData.height || ''} 
                onChange={(e) => setFormData({ ...formData, height: parseInt(e.target.value) || undefined })} 
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-brand-primary/50 focus:bg-white/10 transition-all duration-200" 
                placeholder="170" 
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90 mb-2">Вес (кг)</label>
              <input 
                type="number" 
                min="40" 
                max="150" 
                value={formData.weight || ''} 
                onChange={(e) => setFormData({ ...formData, weight: parseInt(e.target.value) || undefined })} 
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-brand-primary/50 focus:bg-white/10 transition-all duration-200" 
                placeholder="70" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90 mb-2">Телефон</label>
              <input 
                type="tel" 
                pattern="^[+\\d][\\d\\s()-]{6,}$" 
                title="Например: +996 700 123 456" 
                value={formData.phone || ''} 
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })} 
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-brand-primary/50 focus:bg-white/10 transition-all duration-200" 
                placeholder="+996 700 123 456"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-white/90 mb-2">Фото игрока (необязательно)</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] })} 
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/90 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30 focus:border-brand-primary/50 focus:bg-white/10 transition-all duration-200" 
              />
              {!formData.photo && (
                <div className="text-xs text-white/60 mt-1">
                  Если фото не загружено, будет использован силуэт игрока
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white/90 mb-2">Примечание</label>
            <textarea 
              value={formData.notes || ''} 
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })} 
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:border-brand-primary/50 focus:bg-white/10 transition-all duration-200 resize-none" 
              rows={3} 
              placeholder="Особые условия, травмы, аренда..."
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-white/90 mb-2">Статус игрока</label>
            <select 
              value={formData.status} 
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} 
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:border-brand-primary/50 focus:bg-white/10 transition-all duration-200"
            >
              {Object.entries(statusMap).map(([key, value]) => (
                <option key={key} value={key} className="bg-gray-800 text-white">{value}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-4 pt-5 border-t border-white/10">
            <button 
              type="submit" 
              className="flex-1 px-6 py-3 bg-brand-primary hover:bg-brand-primaryDark text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100" 
              disabled={mutationLoading}
            >
              {mutationLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button 
              type="button" 
              onClick={() => { setIsModalOpen(false); setEditingPlayer(null); }} 
              className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 text-white/90 font-semibold rounded-xl border border-white/10 hover:border-white/20 transition-all duration-200"
            >
              Отмена
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setPlayerToDelete(null) }}
        onConfirm={confirmDelete}
        title="Подтверждение удаления"
        message={`Вы действительно хотите удалить игрока ${playerToDelete?.first_name} ${playerToDelete?.last_name}?`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
        confirmFirst={true}
      />
    </div>
  )
} 