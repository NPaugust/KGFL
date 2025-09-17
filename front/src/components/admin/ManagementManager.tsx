"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import Image from 'next/image'
import { Modal, ConfirmModal } from '../ui/Modal'

interface ManagerFormData {
  first_name: string
  last_name: string
  position: string
  email: string
  phone: string
  notes: string
  photo?: File
  order: number
  is_active: boolean
}

const initialFormData: ManagerFormData = {
  first_name: '',
  last_name: '',
  position: 'president',
  email: '',
  phone: '',
  notes: '',
  order: 0,
  is_active: true,
  photo: undefined,
};

const positionMap = {
  president: 'Президент',
  vice_president: 'Вице-президент',
  director: 'Директор',
  manager: 'Менеджер',
  coach: 'Тренер',
  doctor: 'Врач',
  staff: 'Персонал',
};

export function ManagementManager() {
  const { data: managers, loading, error, refetch } = useApi<any[]>(API_ENDPOINTS.MANAGEMENT)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingManager, setEditingManager] = useState<any | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [managerToDelete, setManagerToDelete] = useState<any | null>(null)
  const [formData, setFormData] = useState<ManagerFormData>(initialFormData)

  const { mutate, loading: mutationLoading } = useApiMutation()

  const handleCreateClick = () => {
    setEditingManager(null);
    // Принудительно сбрасываем все данные формы
    setFormData({
      first_name: '',
      last_name: '',
      position: 'president',
      email: '',
      phone: '',
      notes: '',
      order: 0,
      is_active: true,
      photo: undefined,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = new FormData()
      payload.append('first_name', formData.first_name)
      payload.append('last_name', formData.last_name)
      payload.append('position', formData.position)
      payload.append('email', formData.email || '')
      payload.append('phone', formData.phone || '')
      payload.append('notes', formData.notes || '')
      payload.append('order', String(formData.order))
      payload.append('is_active', String(formData.is_active))
      if (formData.photo) payload.append('photo', formData.photo)

      if (editingManager) {
        await mutate(API_ENDPOINTS.MANAGEMENT_DETAIL(editingManager.id), 'PATCH', payload)
      } else {
        await mutate(API_ENDPOINTS.MANAGEMENT, 'POST', payload)
      }

      setIsModalOpen(false)
      setEditingManager(null)
      
      // Сбрасываем formData только при создании нового руководителя
      if (!editingManager) {
        setFormData(initialFormData)
      }
      
      // Принудительно обновляем данные
      await refetch()
      
      // Отправляем событие обновления данных
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { type: 'management' } 
      }))
      
      // Дополнительное обновление через небольшую задержку
      setTimeout(() => {
        refetch()
      }, 500)
    } catch (error) {
      console.error('Ошибка при сохранении руководителя:', error)
      alert('Ошибка при сохранении руководителя')
    }
  }

  const handleEdit = (manager: any) => {
    setEditingManager(manager)
    setFormData({
      first_name: manager.first_name || '',
      last_name: manager.last_name || '',
      position: manager.position || 'president',
      email: manager.email || '',
      phone: manager.phone || '',
      notes: manager.notes || '',
      order: manager.order || 0,
      is_active: manager.is_active !== false
    })
    setIsModalOpen(true)
  }

  const handleDelete = (manager: any) => {
    setManagerToDelete(manager)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!managerToDelete) return
    
    try {
      await mutate(API_ENDPOINTS.MANAGEMENT_DETAIL(managerToDelete.id), 'DELETE')
      refetch()
      setDeleteModalOpen(false)
      setManagerToDelete(null)
    } catch (error: any) {
      alert(`Ошибка при удалении руководителя: ${error?.response?.data?.detail || error?.message || 'Неизвестная ошибка'}`)
    }
  }

  if (loading) {
    return <Loading />
  }

  const managersList = Array.isArray(managers) ? managers : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Управление руководством</h1>
        <button onClick={handleCreateClick} className="btn btn-primary">Добавить руководителя</button>
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
                <th className="px-4 py-3 text-left">Порядок</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {managersList.length > 0 ? managersList.map((manager) => (
                <tr key={manager.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {manager.photo_url || manager.photo ? (
                      <Image 
                        src={manager.photo_url || manager.photo} 
                        alt={`${manager.first_name} ${manager.last_name}`} 
                        width={32} 
                        height={32} 
                        className="w-8 h-8 rounded-full object-cover" 
                      />
                    ) : (
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs">
                        {manager.first_name?.[0]}{manager.last_name?.[0]}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{manager.first_name} {manager.last_name}</td>
                  <td className="px-4 py-3">{positionMap[manager.position as keyof typeof positionMap] || manager.position}</td>
                  <td className="px-4 py-3">{manager.email || '-'}</td>
                  <td className="px-4 py-3">{manager.phone || '-'}</td>
                  <td className="px-4 py-3">{manager.order}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(manager)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(manager)} className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/60">Руководители не найдены</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingManager(null); }}
        title={editingManager ? 'Редактировать руководителя' : 'Добавить руководителя'}
        size="md"
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Имя *</label>
                  <input type="text" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className="input w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Фамилия *</label>
                  <input type="text" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className="input w-full" required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Должность *</label>
                <select value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="input w-full" required>
                  {Object.entries(positionMap).map(([key, value]) => (
                    <option key={key} value={key}>{value}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="input w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Телефон</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Порядок отображения</label>
                <input type="number" min="0" value={formData.order} onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })} className="input w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Примечание</label>
                <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} className="textarea w-full" rows={3} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Фото</label>
                <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] })} className="input w-full" />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                  <span className="text-sm">Активен</span>
                </label>
              </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn btn-primary flex-1" disabled={mutationLoading}>
                {mutationLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button type="button" onClick={() => { 
                setIsModalOpen(false); 
                setEditingManager(null); 
                setFormData(initialFormData);
              }} className="btn btn-outline flex-1">
                Отмена
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setManagerToDelete(null) }}
        onConfirm={confirmDelete}
        title="Подтверждение удаления"
        message={`Вы действительно хотите удалить руководителя ${managerToDelete?.first_name} ${managerToDelete?.last_name}?`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
        confirmFirst={true}
      />
    </div>
  )
} 