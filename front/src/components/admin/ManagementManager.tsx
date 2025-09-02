"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import { getImageUrl } from '@/utils'

interface ManagementFormData {
  name: string
  position: string
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
    email: '',
    phone: ''
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const { mutate, loading: mutationLoading, error } = useApiMutation<any>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setFormError(null)
    setFormSuccess(null)
    if (!formData.name.trim()) return setFormError('Пожалуйста, введите имя сотрудника')
    if (!formData.position) return setFormError('Пожалуйста, выберите должность')

    try {
      let dataToSend: any
      
      // Если есть фото, используем FormData, иначе обычный объект
      if (formData.photo) {
        const formDataToSend = new FormData()
        // Разделяем имя на first_name и last_name
        const nameParts = formData.name.trim().split(' ', 2)
        formDataToSend.append('first_name', nameParts[0] || '')
        formDataToSend.append('last_name', nameParts[1] || '')
        formDataToSend.append('position', formData.position)
        formDataToSend.append('email', formData.email)
        formDataToSend.append('phone', formData.phone)
        formDataToSend.append('photo', formData.photo)
        dataToSend = formDataToSend
      } else {
        dataToSend = {
          // Разделяем имя на first_name и last_name
          first_name: formData.name.trim().split(' ', 2)[0] || '',
          last_name: formData.name.trim().split(' ', 2)[1] || '',
          position: formData.position,
          email: formData.email,
          phone: formData.phone
        }
      }

      if (editingManagement) {
        await mutate(API_ENDPOINTS.MANAGEMENT_DETAIL(editingManagement.id.toString()), 'PUT', dataToSend)
      } else {
        await mutate(API_ENDPOINTS.MANAGEMENT, 'POST', dataToSend)
      }

      setIsModalOpen(false)
      setEditingManagement(null)
      setFormData({ name: '', position: '', email: '', phone: '' })
      
      // Сразу обновляем данные без задержки
      refetch()
      setFormSuccess('Сохранено')
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || (error instanceof Error ? error.message : 'Неизвестная ошибка')
      setFormError(errorMessage)
    }
  }

  const handleEdit = (management: any) => {
    setEditingManagement(management)
    setFormData({
      name: `${management.first_name || ''} ${management.last_name || ''}`.trim(),
      position: management.position,
      email: management.email || '',
      phone: management.phone || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (managementId: string) => {
    if (confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
      try {
        await mutate(API_ENDPOINTS.MANAGEMENT_DETAIL(managementId), 'DELETE')
        refetch()
      } catch (error) {
        alert(`Ошибка при удалении сотрудника: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
      }
    }
  }

  if (loading) {
    return <Loading />
  }

  const managementList = Array.isArray(management) ? management : []

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
                      <img 
                        src={management.photo.startsWith('http') ? management.photo : `/${management.photo}`} 
                        alt={`${management.first_name || ''} ${management.last_name || ''}`.trim()} 
                        className="w-8 h-8 rounded" 
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-500 rounded flex items-center justify-center text-xs">
                        {management.first_name?.[0] || management.last_name?.[0] || '?'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {management.first_name && management.last_name 
                      ? `${management.first_name} ${management.last_name}`
                      : management.first_name || management.last_name || 'Без имени'
                    }
                  </td>
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
              {formError && (
                <div className="text-red-400 text-sm">{formError}</div>
              )}
              {formSuccess && (
                <div className="text-green-400 text-sm">{formSuccess}</div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Имя</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
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
                  <option value="president">Президент</option>
                  <option value="vice_president">Вице-президент</option>
                  <option value="general_secretary">Генеральный секретарь</option>
                  <option value="director">Директор</option>
                  <option value="manager">Менеджер</option>
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
                    <img src={getImageUrl(editingManagement.photo)} alt={editingManagement.name} className="w-20 h-20 object-cover rounded" />
                  </div>
                )}
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
                    setEditingManagement(null)
                    setFormData({ name: '', position: '', email: '', phone: '' })
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