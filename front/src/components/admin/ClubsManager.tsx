"use client"
import { useState } from 'react'
import { useClubs } from '@/hooks/useClubs'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Club } from '@/types'
import { Loading } from '../Loading'
import { apiClient } from '@/services/api'

interface ClubFormData {
  name: string
  city: string
  founded?: number
  stadium?: string
  logo?: File
}

export function ClubsManager() {
  const { clubs, clubsLoading, refetchClubs } = useClubs()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClub, setEditingClub] = useState<Club | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [formData, setFormData] = useState<ClubFormData>({
    name: '',
    city: '',
    founded: undefined,
    stadium: ''
  })

  const createClubMutation = useApiMutation()
  const updateClubMutation = useApiMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      console.log('Submitting club data:', formData)
      
      if (editingClub) {
        console.log('Updating club:', editingClub.id)
        // Для обновления используем обычный JSON
        const updateData = {
          name: formData.name,
          city: formData.city,
          founded: formData.founded,
          stadium: formData.stadium
        }
        await updateClubMutation.mutateAsync(API_ENDPOINTS.CLUB_DETAIL(editingClub.id), 'PUT', updateData)
        
        // Если есть новый логотип, обновляем его отдельно
        if (formData.logo) {
          const logoFormData = new FormData()
          logoFormData.append('logo', formData.logo)
          await apiClient.patch(API_ENDPOINTS.CLUB_DETAIL(editingClub.id), logoFormData)
        }
      } else {
        console.log('Creating new club')
        // Для создания используем обычный JSON
        const createData = {
          name: formData.name,
          city: formData.city,
          founded: formData.founded,
          stadium: formData.stadium
        }
        const response = await createClubMutation.mutateAsync(API_ENDPOINTS.CLUBS, 'POST', createData)
        
        // Если есть логотип, обновляем его отдельно
        if (formData.logo && response.id) {
          const logoFormData = new FormData()
          logoFormData.append('logo', formData.logo)
          await apiClient.patch(API_ENDPOINTS.CLUB_DETAIL(response.id), logoFormData)
        }
      }
      
      setIsModalOpen(false)
      setEditingClub(null)
      setFormData({ name: '', city: '', founded: undefined, stadium: '' })
      
      // Сразу обновляем данные без задержки
      refetchClubs()
      
      // Автоматически обновляем связанные данные
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('data-updated', { 
          detail: { url: '/clubs/table/', method: 'POST' } 
        }))
      }
    } catch (error) {
      console.error('Ошибка при сохранении клуба:', error)
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      alert(`Ошибка при сохранении клуба: ${errorMessage}`)
    }
  }

  const handleEdit = (club: Club) => {
    console.log('Editing club:', club)
    setEditingClub(club)
    setFormData({
      name: club.name || '',
      city: club.city || '',
      founded: club.founded,
      stadium: club.stadium || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (clubId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот клуб?')) {
      try {
        console.log('Deleting club:', clubId)
        const response = await apiClient.delete(API_ENDPOINTS.CLUB_DETAIL(clubId))
        console.log('Клуб удален:', response)
        // Сразу обновляем данные без задержки
        refetchClubs()
      } catch (error) {
        console.error('Ошибка при удалении клуба:', error)
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
        alert(`Ошибка при удалении клуба: ${errorMessage}`)
      }
    }
  }

  if (clubsLoading) {
    return <Loading />
  }

  const clubsList = Array.isArray(clubs) ? clubs : []
  console.log('Clubs list:', clubsList)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление клубами</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          Добавить клуб
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Логотип</th>
                <th className="px-4 py-3 text-left">Название</th>
                <th className="px-4 py-3 text-left">Город</th>
                <th className="px-4 py-3 text-left">Основан</th>
                <th className="px-4 py-3 text-left">Стадион</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {clubsList.length > 0 ? clubsList.map((club) => (
                <tr key={club.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {club.logo_url ? (
                      <div className="relative group">
                        <img 
                          src={club.logo_url.startsWith('http') ? club.logo_url : `/${club.logo_url}`} 
                          alt={club.name} 
                          className="w-12 h-12 rounded-lg object-cover border-2 border-white/20 group-hover:border-brand-primary/50 transition-colors"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                          <span className="text-white text-xs">Просмотр</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-white/40 text-xs">
                        Нет
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{club.name}</td>
                  <td className="px-4 py-3">{club.city}</td>
                  <td className="px-4 py-3">{club.founded}</td>
                  <td className="px-4 py-3">{club.stadium}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(club)}
                        className="btn btn-outline px-3 py-1 text-sm"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(club.id)}
                        className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/60">
                    Клубы не найдены
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
              {editingClub ? 'Редактировать клуб' : 'Добавить клуб'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Город</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Год основания</label>
                <input
                  type="number"
                  value={formData.founded || ''}
                  onChange={(e) => setFormData({ ...formData, founded: parseInt(e.target.value) || undefined })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                />
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
                <label className="block text-sm font-medium mb-1">
                  {editingClub ? 'Новый логотип (необязательно)' : 'Логотип'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, logo: e.target.files?.[0] })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                />
                {editingClub && editingClub.logo_url && (
                  <div className="mt-2">
                    <p className="text-sm text-white/60 mb-2">Текущий логотип:</p>
                    <img 
                      src={editingClub.logo_url.startsWith('http') ? editingClub.logo_url : `/${editingClub.logo_url}`} 
                      alt={editingClub.name} 
                      className="w-20 h-20 object-cover rounded" 
                    />
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={createClubMutation.loading || updateClubMutation.loading}
                >
                  {createClubMutation.loading || updateClubMutation.loading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingClub(null)
                    setFormData({ name: '', city: '', founded: undefined, stadium: '' })
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