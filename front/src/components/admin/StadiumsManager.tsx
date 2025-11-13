"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import { Modal, ConfirmModal } from '../ui/Modal'

interface StadiumFormData {
  name: string
  city?: string
  capacity?: number
  address?: string
}

const initialFormData: StadiumFormData = {
  name: '',
  city: '',
  capacity: undefined,
  address: ''
};

interface Stadium extends StadiumFormData {
  id: string
}

export function StadiumsManager() {
  const { data: stadiums, loading, error, refetch } = useApi<Stadium[]>(API_ENDPOINTS.STADIUMS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Stadium | null>(null)
  const [formData, setFormData] = useState<StadiumFormData>(initialFormData)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [stadiumToDelete, setStadiumToDelete] = useState<Stadium | null>(null)

  const { mutate, loading: mutationLoading } = useApiMutation()

  const handleCreateClick = () => {
    setEditing(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };
  
  const handleEditClick = (stadium: Stadium) => {
    setEditing(stadium);
    setFormData({
      name: stadium.name,
      city: stadium.city,
      capacity: stadium.capacity,
      address: stadium.address
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: any = {
        name: formData.name,
        city: formData.city || '',
        capacity: formData.capacity || null,
        address: formData.address || ''
      }

      if (editing) {
        await mutate(API_ENDPOINTS.STADIUM_DETAIL(editing.id), 'PATCH', payload)
      } else {
        await mutate(API_ENDPOINTS.STADIUMS, 'POST', payload)
      }
      setIsModalOpen(false)
      refetch()
    } catch (err: any) {
        alert(`Ошибка: ${err.message || 'Проверьте правильность введенных данных'}`);
    }
  }

  const handleDelete = (stadium: Stadium) => {
    setStadiumToDelete(stadium);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!stadiumToDelete) return;
    try {
      await mutate(API_ENDPOINTS.STADIUM_DETAIL(stadiumToDelete.id), 'DELETE');
      setDeleteModalOpen(false);
      refetch();
    } catch (err: any) {
      alert(`Ошибка: ${err.message || 'Не удалось удалить стадион'}`);
    }
  };

  if (loading) return <Loading />

  const list = Array.isArray(stadiums) ? stadiums : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Стадионы</h1>
        <button onClick={handleCreateClick} className="btn btn-primary">Добавить стадион</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Название</th>
                <th className="px-4 py-3 text-left">Город</th>
                <th className="px-4 py-3 text-left">Вместимость</th>
                <th className="px-4 py-3 text-left">Адрес</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id} className="border-b border-white/10">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.city || '-'}</td>
                  <td className="px-4 py-3">{s.capacity || '-'}</td>
                  <td className="px-4 py-3">{s.address || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(s)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(s)} className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/60">Стадионы не найдены</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? 'Редактировать стадион' : 'Добавить стадион'}
        size="md"
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Название *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Город</label>
                  <input type="text" value={formData.city || ''} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="input w-full" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Вместимость</label>
                  <input type="number" value={formData.capacity || ''} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || undefined })} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Адрес</label>
                  <input type="text" value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="input w-full" />
                </div>
              </div>
            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn btn-primary flex-1" disabled={mutationLoading}>
                {mutationLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline flex-1">Отмена</button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Подтверждение удаления"
        message={`Вы уверены, что хотите удалить стадион "${stadiumToDelete?.name}"?`}
        variant="danger"
        confirmFirst={true}
      />
    </div>
  )
}
