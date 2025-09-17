"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import { formatDate } from '@/utils'
import { Modal, ConfirmModal } from '../ui/Modal'

interface SeasonFormData {
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  description: string
}

export function SeasonsManager() {
  const { data: seasons, loading, error, refetch } = useApi<any[]>(API_ENDPOINTS.SEASONS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSeason, setEditingSeason] = useState<any | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [seasonToDelete, setSeasonToDelete] = useState<any | null>(null)
  const [formData, setFormData] = useState<SeasonFormData>({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
    description: ''
  })

  const { mutate, loading: mutationLoading } = useApiMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        name: formData.name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: formData.is_active,
        description: formData.description || ''
      }

      if (editingSeason) {
        await mutate(API_ENDPOINTS.SEASON_DETAIL(editingSeason.id), 'PUT', payload)
      } else {
        await mutate(API_ENDPOINTS.SEASONS, 'POST', payload)
      }

      setIsModalOpen(false)
      setEditingSeason(null)
      
      // Сбрасываем formData только при создании нового сезона
      if (!editingSeason) {
        setFormData({
          name: '',
          start_date: '',
          end_date: '',
          is_active: false,
          description: ''
        })
      }
      refetch()
      
      // Отправляем событие обновления данных
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { type: 'season' } 
      }))
    } catch (error) {
      console.error('Ошибка при сохранении сезона:', error)
      alert('Ошибка при сохранении сезона')
    }
  }

  const handleEdit = (season: any) => {
    setEditingSeason(season)
    setFormData({
      name: season.name || '',
      start_date: season.start_date ? new Date(season.start_date).toISOString().split('T')[0] : '',
      end_date: season.end_date ? new Date(season.end_date).toISOString().split('T')[0] : '',
      is_active: season.is_active || false,
      description: season.description || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = (season: any) => {
    setSeasonToDelete(season)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!seasonToDelete) return
    
    try {
      await mutate(API_ENDPOINTS.SEASON_DETAIL(seasonToDelete.id), 'DELETE')
      refetch()
      setDeleteModalOpen(false)
      setSeasonToDelete(null)
    } catch (error: any) {
      alert(`Ошибка при удалении сезона: ${error?.response?.data?.detail || error?.message || 'Неизвестная ошибка'}`)
    }
  }

  const handleSetActive = async (seasonId: string) => {
    try {
      await mutate(API_ENDPOINTS.SEASON_DETAIL(seasonId), 'PATCH', { is_active: true })
      refetch()
    } catch (error) {
      console.error('Ошибка при активации сезона:', error)
      alert('Ошибка при активации сезона')
    }
  }

  if (loading) {
    return <Loading />
  }

  const seasonsList = Array.isArray(seasons) ? seasons : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Управление сезонами</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">Добавить сезон</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Название</th>
                <th className="px-4 py-3 text-left">Начало</th>
                <th className="px-4 py-3 text-left">Конец</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {seasonsList.length > 0 ? seasonsList.map((season) => (
                <tr key={season.id} className="border-b border-white/10">
                  <td className="px-4 py-3 font-medium">{season.name}</td>
                  <td className="px-4 py-3">{season.start_date ? formatDate(season.start_date) : '-'}</td>
                  <td className="px-4 py-3">{season.end_date ? formatDate(season.end_date) : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      season.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {season.is_active ? 'Активный' : 'Неактивный'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {!season.is_active && (
                        <button onClick={() => handleSetActive(season.id)} className="btn btn-outline px-3 py-1 text-sm">Активировать</button>
                      )}
                      <button onClick={() => handleEdit(season)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(season)} className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/60">Сезоны не найдены</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingSeason(null); }}
        title={editingSeason ? 'Редактировать сезон' : 'Добавить сезон'}
        size="md"
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название сезона *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input w-full" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Дата начала *</label>
                <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className="input w-full" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Дата окончания *</label>
                <input type="date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="input w-full" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="textarea w-full" rows={3} />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                  <span className="text-sm">Активный сезон</span>
                </label>
              </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn btn-primary flex-1" disabled={mutationLoading}>
                {mutationLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button type="button" onClick={() => { setIsModalOpen(false); setEditingSeason(null); }} className="btn btn-outline flex-1">
                Отмена
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setSeasonToDelete(null) }}
        onConfirm={confirmDelete}
        title="Подтверждение удаления"
        message={`Вы действительно хотите удалить сезон "${seasonToDelete?.name}"?`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
        confirmFirst={true}
      />
    </div>
  )
}