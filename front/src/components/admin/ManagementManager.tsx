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
  notes?: string
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
    phone: '',
    notes: ''
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const { mutate, loading: mutationLoading, error } = useApiMutation<any>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setFormError(null)
    setFormSuccess(null)
    if (!formData.name.trim()) return setFormError('Пожалуйста, введите ФИО')
    if (!formData.position) return setFormError('Пожалуйста, укажите должность')

    try {
      let dataToSend: any
      if (formData.photo) {
        const fd = new FormData()
        fd.append('name', formData.name)
        fd.append('position', formData.position)
        if (formData.email) fd.append('email', formData.email)
        if (formData.phone) fd.append('phone', formData.phone)
        if (formData.notes) fd.append('notes', formData.notes)
        fd.append('photo', formData.photo)
        dataToSend = fd
      } else {
        dataToSend = {
          name: formData.name,
          position: formData.position,
          email: formData.email,
          phone: formData.phone,
          notes: formData.notes
        }
      }

      if (editingManagement) {
        await mutate(API_ENDPOINTS.MANAGEMENT_DETAIL(editingManagement.id.toString()), 'PUT', dataToSend)
      } else {
        await mutate(API_ENDPOINTS.MANAGEMENT, 'POST', dataToSend)
      }

      setIsModalOpen(false)
      setEditingManagement(null)
      setFormData({ name: '', position: '', email: '', phone: '', notes: '' })
      refetch()
      setFormSuccess('Сохранено')
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || (error instanceof Error ? error.message : 'Неизвестная ошибка')
      setFormError(errorMessage)
    }
  }

  const handleEdit = (m: any) => {
    setEditingManagement(m)
    setFormData({
      name: m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim(),
      position: m.position,
      email: m.email || '',
      phone: m.phone || '',
      notes: m.notes || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (managementId: string) => {
    if (confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
      try {
        await mutate(API_ENDPOINTS.MANAGEMENT_DETAIL(managementId), 'DELETE')
        refetch()
      } catch (error) {
        alert(`Ошибка при удалении сотрудника`)
      }
    }
  }

  if (loading) return <Loading />
  const managementList = Array.isArray(management) ? management : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление руководством</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">Добавить сотрудника</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Фото</th>
                <th className="px-4 py-3 text-left">ФИО</th>
                <th className="px-4 py-3 text-left">Должность</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Телефон</th>
                <th className="px-4 py-3 text-left">Примечания</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {managementList.length > 0 ? managementList.map((m) => (
                <tr key={m.id} className="border-b border-white/10">
                  <td className="px-4 py-3">{m.photo ? (<img src={getImageUrl(m.photo)} alt={m.name} className="w-8 h-8 rounded" />) : (<div className="w-8 h-8 bg-gray-500 rounded" />)}</td>
                  <td className="px-4 py-3 font-medium">{m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim()}</td>
                  <td className="px-4 py-3">{m.position}</td>
                  <td className="px-4 py-3">{m.email || '-'}</td>
                  <td className="px-4 py-3">{m.phone || '-'}</td>
                  <td className="px-4 py-3 max-w-xs truncate" title={m.notes || m.bio}>{m.notes || m.bio || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(m)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(m.id)} className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/60">Сотрудники не найдены</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingManagement ? 'Редактировать сотрудника' : 'Добавить сотрудника'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && <div className="text-red-400 text-sm">{formError}</div>}
              {formSuccess && <div className="text-green-400 text-sm">{formSuccess}</div>}

              <div>
                <label className="block text-sm font-medium mb-1">ФИО *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input w-full" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Должность *</label>
                <input type="text" value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="input w-full" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Телефон</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input w-full" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Примечания</label>
                <textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="input w-full" rows={3} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Фото</label>
                <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] })} className="input w-full" />
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" className="btn btn-primary flex-1" disabled={mutationLoading}>{mutationLoading ? 'Сохранение...' : 'Сохранить'}</button>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingManagement(null); setFormData({ name: '', position: '', email: '', phone: '', notes: '' }) }} className="btn btn-outline flex-1">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 