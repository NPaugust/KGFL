"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import Image from 'next/image'
import { apiClient } from '@/services/api'

interface RefereeFormData {
  name: string
  position: string
  experience: number
  bio: string
  photo?: File
}

export function RefereesManager() {
  const { data: referees, loading, refetch } = useApi(API_ENDPOINTS.REFEREES)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReferee, setEditingReferee] = useState<any>(null)
  const [formData, setFormData] = useState<RefereeFormData>({
    name: '',
    position: '',
    experience: 0,
    bio: ''
  })

  const createRefereeMutation = useApiMutation(API_ENDPOINTS.REFEREES, 'POST')
  const updateRefereeMutation = useApiMutation(API_ENDPOINTS.REFEREES_DETAIL(editingReferee?.id?.toString() || ''), 'PUT')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      console.log('Submitting referee data:', formData)
      
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('position', formData.position)
      formDataToSend.append('experience', formData.experience.toString())
      formDataToSend.append('bio', formData.bio)
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo)
      }

      if (editingReferee) {
        console.log('Updating referee:', editingReferee.id)
        await updateRefereeMutation.mutateAsync(formDataToSend)
      } else {
        console.log('Creating new referee')
        await createRefereeMutation.mutateAsync(formDataToSend)
      }

      setIsModalOpen(false)
      setEditingReferee(null)
      setFormData({ name: '', position: '', experience: 0, bio: '' })
      
      // Принудительно обновляем данные
      setTimeout(() => {
        refetch()
      }, 500)
    } catch (error) {
      console.error('Ошибка при сохранении судьи:', error)
      alert(`Ошибка при сохранении судьи: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }

  const handleEdit = (referee: any) => {
    console.log('Editing referee:', referee)
    setEditingReferee(referee)
    setFormData({
      name: referee.name,
      position: referee.position,
      experience: referee.experience || 0,
      bio: referee.bio || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (refereeId: string) => {
    if (confirm('Вы уверены, что хотите удалить этого судью?')) {
      try {
        console.log('Deleting referee:', refereeId)
        const response = await apiClient.delete(API_ENDPOINTS.REFEREES_DETAIL(refereeId))
        console.log('Судья удален:', response)
        refetch()
      } catch (error) {
        console.error('Ошибка при удалении судьи:', error)
        alert(`Ошибка при удалении судьи: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      }
    }
  }

  if (loading) {
    return <Loading />
  }

  const refereesList = Array.isArray(referees) ? referees : []
  console.log('Referees list:', refereesList)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление судьями</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          Добавить судью
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
                <th className="px-4 py-3 text-left">Опыт (лет)</th>
                <th className="px-4 py-3 text-left">Биография</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {refereesList.length > 0 ? refereesList.map((referee) => (
                <tr key={referee.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {referee.photo ? (
                      <img src={referee.photo} alt={referee.name} className="w-8 h-8 rounded" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-500 rounded flex items-center justify-center text-xs">
                        {referee.name?.[0]}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{referee.name}</td>
                  <td className="px-4 py-3">{referee.position}</td>
                  <td className="px-4 py-3">{referee.experience}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate" title={referee.bio}>
                      {referee.bio || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(referee)}
                        className="btn btn-outline px-3 py-1 text-sm"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(referee.id)}
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
                    Судьи не найдены
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
              {editingReferee ? 'Редактировать судью' : 'Добавить судью'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Имя</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  required
                />
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
                  <option value="Главный судья">Главный судья</option>
                  <option value="Помощник судьи">Помощник судьи</option>
                  <option value="Четвертый судья">Четвертый судья</option>
                  <option value="VAR">VAR</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Опыт (лет)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Биография</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {editingReferee ? 'Новое фото (необязательно)' : 'Фото'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                />
                {editingReferee && editingReferee.photo && (
                  <div className="mt-2">
                    <p className="text-sm text-white/60 mb-2">Текущее фото:</p>
                    <img src={editingReferee.photo} alt={editingReferee.name} className="w-20 h-20 object-cover rounded" />
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={createRefereeMutation.loading || updateRefereeMutation.loading}
                >
                  {createRefereeMutation.loading || updateRefereeMutation.loading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingReferee(null)
                    setFormData({ name: '', position: '', experience: 0, bio: '' })
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