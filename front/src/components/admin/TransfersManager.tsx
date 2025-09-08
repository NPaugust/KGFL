"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import { formatDate } from '@/utils'
import { Modal, ConfirmModal } from '../ui/Modal'

interface TransferFormData {
  player: string
  from_club: string
  to_club: string
  transfer_date: string
  transfer_fee: number
  status: string
  notes: string
}

export function TransfersManager({ onClose }: { onClose: () => void }) {
  const { data: transfers, loading, error, refetch } = useApi<any[]>(API_ENDPOINTS.PLAYER_TRANSFERS)
  const { data: players } = useApi<any[]>(API_ENDPOINTS.PLAYERS)
  const { data: clubs } = useApi<any[]>(`${API_ENDPOINTS.CLUBS}?all=1`)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransfer, setEditingTransfer] = useState<any | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [transferToDelete, setTransferToDelete] = useState<any | null>(null)
  const [formData, setFormData] = useState<TransferFormData>({
    player: '',
    from_club: '',
    to_club: '',
    transfer_date: '',
    transfer_fee: 0,
    status: 'pending',
    notes: ''
  })

  const { mutate, loading: mutationLoading } = useApiMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        player: formData.player,
        from_club: formData.from_club,
        to_club: formData.to_club,
        transfer_date: formData.transfer_date,
        transfer_fee: formData.transfer_fee,
        status: formData.status,
        notes: formData.notes || ''
      }

      if (editingTransfer) {
        await mutate(API_ENDPOINTS.PLAYER_TRANSFER_DETAIL(editingTransfer.id), 'PUT', payload)
      } else {
        await mutate(API_ENDPOINTS.PLAYER_TRANSFERS, 'POST', payload)
      }

      setIsModalOpen(false)
      setEditingTransfer(null)
      
      // Сбрасываем formData только при создании нового трансфера
      if (!editingTransfer) {
        setFormData({
          player: '',
          from_club: '',
          to_club: '',
          transfer_date: '',
          transfer_fee: 0,
          status: 'pending',
          notes: ''
        })
      }
      refetch()
      
      // Отправляем событие обновления данных
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { type: 'transfer' } 
      }))
    } catch (error) {
      console.error('Ошибка при сохранении трансфера:', error)
      alert('Ошибка при сохранении трансфера')
    }
  }

  const handleEdit = (transfer: any) => {
    setEditingTransfer(transfer)
    setFormData({
      player: transfer.player?.id || '',
      from_club: transfer.from_club?.id || '',
      to_club: transfer.to_club?.id || '',
      transfer_date: transfer.transfer_date ? new Date(transfer.transfer_date).toISOString().split('T')[0] : '',
      transfer_fee: transfer.transfer_fee || 0,
      status: transfer.status || 'pending',
      notes: transfer.notes || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = (transfer: any) => {
    setTransferToDelete(transfer)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!transferToDelete) return
    
    try {
      await mutate(API_ENDPOINTS.PLAYER_TRANSFER_DETAIL(transferToDelete.id), 'DELETE')
      refetch()
      setDeleteModalOpen(false)
      setTransferToDelete(null)
      alert('Трансфер успешно удален!')
    } catch (error: any) {
      alert(`Ошибка при удалении трансфера: ${error?.response?.data?.detail || error?.message || 'Неизвестная ошибка'}`)
    }
  }

  const handleStatusChange = async (transferId: string, newStatus: string) => {
    try {
      await mutate(API_ENDPOINTS.PLAYER_TRANSFER_DETAIL(transferId), 'PATCH', { status: newStatus })
      refetch()
    } catch (error) {
      console.error('Ошибка при изменении статуса:', error)
      alert('Ошибка при изменении статуса')
    }
  }

  if (loading) {
    return <Loading />
  }

  const transfersList = Array.isArray(transfers) ? transfers : []
  const playersList = Array.isArray(players) ? players : []
  const clubsList = Array.isArray(clubs) ? clubs : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Управление трансферами</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">Добавить трансфер</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Игрок</th>
                <th className="px-4 py-3 text-left">Из клуба</th>
                <th className="px-4 py-3 text-left">В клуб</th>
                <th className="px-4 py-3 text-left">Дата</th>
                <th className="px-4 py-3 text-left">Сумма</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {transfersList.length > 0 ? transfersList.map((transfer) => (
                <tr key={transfer.id} className="border-b border-white/10">
                  <td className="px-4 py-3 font-medium">
                    {transfer.player_full_name || `${transfer.player?.first_name} ${transfer.player?.last_name}`}
                  </td>
                  <td className="px-4 py-3">{transfer.from_club?.name || '-'}</td>
                  <td className="px-4 py-3">{transfer.to_club?.name || '-'}</td>
                  <td className="px-4 py-3">{transfer.transfer_date ? formatDate(transfer.transfer_date) : '-'}</td>
                  <td className="px-4 py-3">{transfer.transfer_fee ? `${transfer.transfer_fee} $` : 'Бесплатно'}</td>
                  <td className="px-4 py-3">
                    <select 
                      value={transfer.status} 
                      onChange={(e) => handleStatusChange(transfer.id, e.target.value)}
                      className={`px-2 py-1 rounded text-xs border-0 ${
                        transfer.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 
                        transfer.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-red-500/20 text-red-400'
                      }`}
                    >
                      <option value="pending">Ожидание</option>
                      <option value="confirmed">Подтверждён</option>
                      <option value="cancelled">Отменён</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(transfer)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDelete(transfer)
                        }} 
                        className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm"
                        type="button"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/60">Трансферы не найдены</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingTransfer(null); }}
        title={editingTransfer ? 'Редактировать трансфер' : 'Добавить трансфер'}
        size="lg"
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Игрок *</label>
                <select value={formData.player} onChange={(e) => setFormData({ ...formData, player: e.target.value })} className="input w-full" required>
                  <option value="">Выберите игрока</option>
                  {playersList.map((player) => (
                    <option key={player.id} value={player.id.toString()}>
                      {player.first_name} {player.last_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Из клуба *</label>
                <select value={formData.from_club} onChange={(e) => setFormData({ ...formData, from_club: e.target.value })} className="input w-full" required>
                  <option value="">Выберите клуб</option>
                  {clubsList.map((club) => (
                    <option key={club.id} value={club.id.toString()}>{club.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">В клуб *</label>
                <select value={formData.to_club} onChange={(e) => setFormData({ ...formData, to_club: e.target.value })} className="input w-full" required>
                  <option value="">Выберите клуб</option>
                  {clubsList.map((club) => (
                    <option key={club.id} value={club.id.toString()}>{club.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Дата трансфера *</label>
                <input type="date" value={formData.transfer_date} onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })} className="input w-full" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Сумма трансфера</label>
                <input type="number" min="0" value={formData.transfer_fee} onChange={(e) => setFormData({ ...formData, transfer_fee: parseInt(e.target.value) || 0 })} className="input w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Статус *</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="input w-full" required>
                  <option value="pending">Ожидание</option>
                  <option value="confirmed">Подтверждён</option>
                  <option value="cancelled">Отменён</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Примечания</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="textarea w-full" rows={3} />
              </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn btn-primary flex-1" disabled={mutationLoading}>
                {mutationLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button type="button" onClick={() => { setIsModalOpen(false); setEditingTransfer(null); }} className="btn btn-outline flex-1">
                Отмена
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setTransferToDelete(null) }}
        onConfirm={confirmDelete}
        title="Подтверждение удаления"
        message={`Вы действительно хотите удалить трансфер игрока ${transferToDelete?.player_name}?`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
      />
    </div>
  )
}