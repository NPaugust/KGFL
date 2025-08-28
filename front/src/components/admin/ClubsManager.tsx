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

  const createClubMutation = useApiMutation(API_ENDPOINTS.CLUBS, 'POST')
  const updateClubMutation = useApiMutation(API_ENDPOINTS.CLUB_DETAIL(editingClub?.id?.toString() || ''), 'PUT')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      console.log('Submitting club data:', formData)
      
      if (editingClub) {
        console.log('Updating club:', editingClub.id)
        await updateClubMutation.mutateAsync(formData)
      } else {
        console.log('Creating new club')
        await createClubMutation.mutateAsync(formData)
      }
      
      setIsModalOpen(false)
      setEditingClub(null)
      setFormData({ name: '', city: '', founded: undefined, stadium: '' })
      
      // Принудительно обновляем данные
      setTimeout(() => {
        refetchClubs()
      }, 500)
    } catch (error) {
      console.error('Ошибка при сохранении клуба:', error)
      alert(`Ошибка при сохранении клуба: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
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
        // Принудительно обновляем данные
        setTimeout(() => {
          refetchClubs()
        }, 500)
      } catch (error) {
        console.error('Ошибка при удалении клуба:', error)
        alert(`Ошибка при удалении клуба: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
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
                    {club.logo && (
                      <img src={club.logo} alt={club.name} className="w-8 h-8 rounded" />
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
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Город</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  required
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