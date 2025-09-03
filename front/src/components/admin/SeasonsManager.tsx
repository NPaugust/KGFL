"use client"

import { useState } from 'react'
import { useApi, useApiMutation } from '@/hooks/useApi'
import { useSeasonStore } from '@/store/useSeasonStore'
import { API_ENDPOINTS } from '@/services/api'

interface Season {
  id: number
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  description: string
  created_at: string
  updated_at: string
}

interface SeasonFormData {
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  description: string
}

export function SeasonsManager() {
  const { data: seasons, loading, refetch } = useApi<Season[]>(API_ENDPOINTS.SEASONS)
  const { fetchSeasons } = useSeasonStore()
  const [showForm, setShowForm] = useState(false)
  const [editingSeason, setEditingSeason] = useState<Season | null>(null)
  const [formData, setFormData] = useState<SeasonFormData>({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
    description: ''
  })

  const createMutation = useApiMutation<Season>()
  const updateMutation = useApiMutation<Season>()
  const deleteMutation = useApiMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingSeason) {
        await updateMutation.mutateAsync(`${API_ENDPOINTS.SEASONS}${editingSeason.id}/`, 'PUT', formData)
      } else {
        await createMutation.mutateAsync(API_ENDPOINTS.SEASONS, 'POST', formData)
      }
      
      setShowForm(false)
      setEditingSeason(null)
      resetForm()
      refetch()
      // Обновляем store сезонов для всех компонентов
      fetchSeasons()
    } catch (error) {
      console.error('Ошибка при сохранении сезона:', error)
    }
  }

  const handleEdit = (season: Season) => {
    setEditingSeason(season)
    setFormData({
      name: season.name,
      start_date: season.start_date,
      end_date: season.end_date,
      is_active: season.is_active,
      description: season.description
    })
    setShowForm(true)
  }

  const handleDelete = async (seasonId: number) => {
    if (confirm('Вы уверены, что хотите удалить этот сезон?')) {
      try {
        await deleteMutation.mutateAsync(`${API_ENDPOINTS.SEASONS}${seasonId}/`, 'DELETE')
        refetch()
        // Обновляем store сезонов для всех компонентов
        fetchSeasons()
      } catch (error) {
        console.error('Ошибка при удалении сезона:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      is_active: false,
      description: ''
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingSeason(null)
    resetForm()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Управление сезонами</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
        >
          Добавить сезон
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="text-lg font-semibold">
              {editingSeason ? 'Редактировать сезон' : 'Новый сезон'}
            </h3>
          </div>
          <form onSubmit={handleSubmit} className="card-body space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Название сезона *
                </label>
                <input
                  type="text"
                  className="input w-full"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="Например: Сезон 2024/25"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Активный сезон
                </label>
                <div className="flex items-center mt-2">
                  <input
                    type="checkbox"
                    className="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <span className="ml-2 text-sm">Сделать активным</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Дата начала
                </label>
                <input
                  type="date"
                  className="input w-full"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  Дата окончания
                </label>
                <input
                  type="date"
                  className="input w-full"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Описание
              </label>
              <textarea
                className="textarea w-full"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Описание сезона..."
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCancel}
              >
                Отмена
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createMutation.loading || updateMutation.loading}
              >
                {createMutation.loading || updateMutation.loading ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Название</th>
                <th className="px-4 py-3 text-left">Период</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Описание</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(seasons) && seasons.map((season) => (
                <tr key={season.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    <div className="font-medium">{season.name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">
                      {season.start_date && (
                        <div>Начало: {new Date(season.start_date).toLocaleDateString('ru-RU')}</div>
                      )}
                      {season.end_date && (
                        <div>Конец: {new Date(season.end_date).toLocaleDateString('ru-RU')}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      season.is_active 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {season.is_active ? 'Активный' : 'Неактивный'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-gray-300 max-w-xs truncate">
                      {season.description || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(season)}
                        className="btn btn-sm btn-outline"
                      >
                        Изменить
                      </button>
                      <button
                        onClick={() => handleDelete(season.id)}
                        className="btn btn-sm btn-danger"
                        disabled={deleteMutation.loading}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {loading && (
          <div className="p-6 text-center text-gray-400">
            Загрузка сезонов...
          </div>
        )}
        
        {!loading && (!seasons || seasons.length === 0) && (
          <div className="p-6 text-center text-gray-400">
            Сезоны не найдены. Создайте первый сезон.
          </div>
        )}
      </div>
    </div>
  )
}
