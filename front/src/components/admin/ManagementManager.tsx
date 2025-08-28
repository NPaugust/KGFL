"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import Image from 'next/image'
import { apiClient } from '@/services/api'

interface ManagementFormData {
  name: string
  position: string
  bio: string
  email: string
  phone: string
  photo?: File
}

export function ManagementManager() {
  const { data: management, loading, refetch } = useApi(API_ENDPOINTS.MANAGEMENT)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingManagement, setEditingManagement] = useState<any>(null)
  const [formData, setFormData] = useState<ManagementFormData>({
    name: '',
    position: '',
    bio: '',
    email: '',
    phone: ''
  })

  const createManagementMutation = useApiMutation(API_ENDPOINTS.MANAGEMENT, 'POST')
  const updateManagementMutation = useApiMutation(API_ENDPOINTS.MANAGEMENT_DETAIL(editingManagement?.id?.toString() || ''), 'PUT')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      console.log('Submitting management data:', formData)
      
      const formDataToSend = new FormData()
      formDataToSend.append('name', formData.name)
      formDataToSend.append('position', formData.position)
      formDataToSend.append('bio', formData.bio)
      formDataToSend.append('email', formData.email)
      formDataToSend.append('phone', formData.phone)
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo)
      }

      if (editingManagement) {
        console.log('Updating management:', editingManagement.id)
        await updateManagementMutation.mutateAsync(formDataToSend)
      } else {
        console.log('Creating new management')
        await createManagementMutation.mutateAsync(formDataToSend)
      }

      setIsModalOpen(false)
      setEditingManagement(null)
      setFormData({ name: '', position: '', bio: '', email: '', phone: '' })
      
      // Принудительно обновляем данные
      setTimeout(() => {
        refetch()
      }, 500)
    } catch (error) {
      console.error('Ошибка при сохранении руководства:', error)
      alert(`Ошибка при сохранении руководства: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
    }
  }

  const handleEdit = (management: any) => {
    console.log('Editing management:', management)
    setEditingManagement(management)
    setFormData({
      name: management.name,
      position: management.position,
      bio: management.bio || '',
      email: management.email || '',
      phone: management.phone || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (managementId: string) => {
    if (confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
      try {
        console.log('Deleting management:', managementId)
        const response = await apiClient.delete(API_ENDPOINTS.MANAGEMENT_DETAIL(managementId))
        console.log('Сотрудник удален:', response)
        refetch()
      } catch (error) {
        console.error('Ошибка при удалении сотрудника:', error)
        alert(`Ошибка при удалении сотрудника: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      }
    }
  }

  if (loading) {
    return <Loading />
  }

  const managementList = Array.isArray(management) ? management : []
  console.log('Management list:', managementList)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление руководством</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          Добавить сотрудника
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Фото</th>
                <th className="px-4 py-3 text-left">Имя</th>
                <th className="px-4 py-3 text-left">Должность</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Телефон</th>
                <th className="px-4 py-3 text-left">Биография</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {managementList.length > 0 ? managementList.map((management) => (
                <tr key={management.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {management.photo ? (
                      <img src={management.photo} alt={management.name} className="w-8 h-8 rounded" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-500 rounded flex items-center justify-center text-xs">
                        {management.name?.[0]}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{management.name}</td>
                  <td className="px-4 py-3">{management.position}</td>
                  <td className="px-4 py-3">{management.email || '-'}</td>
                  <td className="px-4 py-3">{management.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs truncate" title={management.bio}>
                      {management.bio || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(management)}
                        className="btn btn-outline px-3 py-1 text-sm"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(management.id)}
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
                    Сотрудники не найдены
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
              {editingManagement ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
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
                <label className="block text-sm font-medium mb-1">Должность</label>
                <select
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  required
                >
                  <option value="">Выберите должность</option>
                  <option value="Президент">Президент</option>
                  <option value="Вице-президент">Вице-президент</option>
                  <option value="Генеральный директор">Генеральный директор</option>
                  <option value="Технический директор">Технический директор</option>
                  <option value="Менеджер">Менеджер</option>
                  <option value="Координатор">Координатор</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Телефон</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
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
                  {editingManagement ? 'Новое фото (необязательно)' : 'Фото'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                />
                {editingManagement && editingManagement.photo && (
                  <div className="mt-2">
                    <p className="text-sm text-white/60 mb-2">Текущее фото:</p>
                    <img src={editingManagement.photo} alt={editingManagement.name} className="w-20 h-20 object-cover rounded" />
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={createManagementMutation.loading || updateManagementMutation.loading}
                >
                  {createManagementMutation.loading || updateManagementMutation.loading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingManagement(null)
                    setFormData({ name: '', position: '', bio: '', email: '', phone: '' })
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