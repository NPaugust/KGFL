"use client"
import { useState } from 'react'
import { API_ENDPOINTS } from '@/services/api'
import { Manager } from '@/types'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { Loading } from '../Loading'
import Image from 'next/image'
import { Modal, ConfirmModal } from '../ui/Modal'

interface ManagerFormData {
  first_name: string
  last_name: string
  position: string
  bio: string
  email: string
  phone: string
  photo?: File
  order: number
  is_active: boolean
}

export function ManagementManager() {
  const { data: management, loading, error, refetch } = useApi<Manager[]>(API_ENDPOINTS.MANAGEMENT)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingManager, setEditingManager] = useState<Manager | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [managerToDelete, setManagerToDelete] = useState<Manager | null>(null)
  const [formData, setFormData] = useState<ManagerFormData>({
    first_name: '',
    last_name: '',
    position: 'president',
    bio: '',
    email: '',
    phone: '',
    order: 0,
    is_active: true
  })

  const { mutate, loading: mutationLoading } = useApiMutation<Manager>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = new FormData();
      Object.keys(formData).forEach(key => {
        const value = formData[key as keyof typeof formData];
        if (key === 'photo' && value instanceof File) {
            payload.append('photo', value);
        } else if (value !== null && value !== undefined && value !== '') {
            payload.append(key, String(value));
        }
      });

      if (editingManager) {
        await mutate(
          API_ENDPOINTS.MANAGEMENT_DETAIL(String(editingManager.id)),
          'PATCH',
          payload
        )
      } else {
        await mutate(
          API_ENDPOINTS.MANAGEMENT,
          'POST',
          payload
        )
      }
      refetch()
      
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { type: 'management' } 
      }))
    } catch (error) {
      console.error(error);
      alert('Ошибка при сохранении сотрудника.');
    }
  }

  const handleEdit = (manager: Manager) => {
    setEditingManager(manager);
    setFormData({
      first_name: manager.first_name || '',
      last_name: manager.last_name || '',
      position: manager.position || 'president',
      bio: manager.bio || '',
      email: manager.email || '',
      phone: manager.phone || '',
      order: (manager as any).order || 0,
      is_active: !!manager.is_active,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (managerId: string) => {
    if (window.confirm('Вы уверены?')) {
        await mutate(
          API_ENDPOINTS.MANAGEMENT_DETAIL(String(managerId)),
          'DELETE'
        )
    }
  }

  if (loading) {
    return <Loading />
  }

  const managersList = Array.isArray(management) ? management : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Управление руководством</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">Добавить руководителя</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Фото</th>
                <th className="px-4 py-3 text-left">Имя</th>
                <th className="px-4 py-3 text-left">Должность</th>
                <th className="px-4 py-3 text-left">Телефон</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {managersList.length > 0 ? managersList.map((manager) => (
                <tr key={manager.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {manager.photo_url || manager.photo ? (
                      <Image 
                        src={(manager.photo_url || manager.photo) as string}
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
                  <td className="px-4 py-3">{(manager as any).position_display || manager.position}</td>
                  <td className="px-4 py-3">{manager.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      manager.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {manager.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(manager)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(manager.id)} className="btn bg-red-500 hover-bg-red-600 px-3 py-1 text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/60">Руководители не найдены</td>
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
                <select value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} className="input w-full" required style={{ colorScheme: 'dark' as any }}>
                  <option value="president">Президент</option>
                  <option value="vice_president">Вице-президент</option>
                  <option value="general_secretary">Генеральный секретарь</option>
                  <option value="director">Директор</option>
                  <option value="manager">Менеджер</option>
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
                <label className="block text-sm font-medium mb-1">Биография</label>
                <textarea value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} className="textarea w-full" rows={3} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Фото {editingManager ? '(не обязательно)' : '*'}</label>
                <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] })} className="input w-full" required={!editingManager} />
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
              <button type="button" onClick={() => { setIsModalOpen(false); setEditingManager(null); }} className="btn btn-outline flex-1">
                Отмена
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setManagerToDelete(null) }}
        onConfirm={() => { if (managerToDelete) handleDelete(String(managerToDelete.id)); }}
        title="Подтверждение удаления"
        message={`Вы действительно хотите удалить руководителя ${managerToDelete?.first_name} ${managerToDelete?.last_name}?`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
      />
    </div>
  )
} 