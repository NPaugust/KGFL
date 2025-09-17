"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import Image from 'next/image'
import { getImageUrl } from '@/utils'
import { Modal, ConfirmModal } from '../ui/Modal'

interface RefereeFormData {
  first_name: string
  last_name: string
  category: string
  region: string
  experience_months: number
  phone: string
  nationality: string
  photo?: File
  is_active: boolean
}

const initialFormData: RefereeFormData = {
  first_name: '',
  last_name: '',
  category: 'chief',
  region: '',
  experience_months: 0,
  phone: '',
  nationality: '',
  is_active: true,
  photo: undefined,
};

const categoryMap = {
  chief: 'Главный судья',
  assistant: 'Помощник судьи',
  var: 'Видеоассистент (VAR)',
  inspector: 'Инспектор матча',
};

export function RefereesManager() {
  const { data: referees, loading, error, refetch } = useApi<any[]>(API_ENDPOINTS.REFEREES)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReferee, setEditingReferee] = useState<any | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [refereeToDelete, setRefereeToDelete] = useState<any | null>(null)
  const [formData, setFormData] = useState<RefereeFormData>(initialFormData)

  const { mutate, loading: mutationLoading } = useApiMutation()

  const handleCreateClick = () => {
    setEditingReferee(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = new FormData()
      payload.append('first_name', formData.first_name)
      payload.append('last_name', formData.last_name)
      payload.append('category', formData.category)
      payload.append('region', formData.region || '')
      payload.append('experience_months', String(formData.experience_months))
      payload.append('phone', formData.phone || '')
      payload.append('nationality', formData.nationality || '')
      payload.append('is_active', String(formData.is_active))
      
      // Добавляем фото только если оно было выбрано или при создании нового судьи
      if (formData.photo instanceof File) {
        payload.append('photo', formData.photo)
      } else if (!editingReferee && !formData.photo) {
        // При создании нового судьи фото обязательно
        alert('Фото обязательно для нового судьи')
        return
      }

      if (editingReferee) {
        // Используем PATCH вместо PUT, чтобы не требовать фото каждый раз
        await mutate(API_ENDPOINTS.REFEREES_DETAIL(editingReferee.id), 'PATCH', payload)
      } else {
        await mutate(API_ENDPOINTS.REFEREES, 'POST', payload)
      }

      setIsModalOpen(false)
      setEditingReferee(null)
      
      // Сбрасываем formData только при создании нового судьи
      if (!editingReferee) {
        setFormData(initialFormData)
      }
      refetch()
      
      // Отправляем событие обновления данных
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { type: 'referee' } 
      }))
    } catch (error) {
      console.error('Ошибка при сохранении судьи:', error)
      alert('Ошибка при сохранении судьи')
    }
  }

  const handleEdit = (referee: any) => {
    setEditingReferee(referee)
      setFormData({
        first_name: referee.first_name || '',
        last_name: referee.last_name || '',
        category: referee.category || 'chief',
        region: referee.region || '',
        experience_months: referee.experience_months || 0,
        phone: referee.phone || '',
        nationality: referee.nationality || '',
        photo: undefined, // НЕ сбрасываем при редактировании - оставляем текущее фото
        is_active: referee.is_active !== false
      })
    setIsModalOpen(true)
  }

  const handleDelete = (referee: any) => {
    setRefereeToDelete(referee)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!refereeToDelete) return
    
    try {
      await mutate(API_ENDPOINTS.REFEREES_DETAIL(refereeToDelete.id), 'DELETE')
      refetch()
      setDeleteModalOpen(false)
      setRefereeToDelete(null)
    } catch (error: any) {
      alert(`Ошибка при удалении судьи: ${error?.response?.data?.detail || error?.message || 'Неизвестная ошибка'}`)
    }
  }

  if (loading) {
    return <Loading />
  }

  const refereesList = Array.isArray(referees) ? referees : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Управление судьями</h1>
        <button onClick={handleCreateClick} className="btn btn-primary">Добавить судью</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Фото</th>
                <th className="px-4 py-3 text-left">Имя</th>
                <th className="px-4 py-3 text-left">Категория</th>
                <th className="px-4 py-3 text-left">Регион</th>
                <th className="px-4 py-3 text-left">Телефон</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {refereesList.length > 0 ? refereesList.map((referee) => (
                <tr key={referee.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {referee.photo_url || referee.photo ? (
                      <Image 
                        src={referee.photo_url || getImageUrl(referee.photo)} 
                        alt={`${referee.first_name} ${referee.last_name}`} 
                        width={32} 
                        height={32} 
                        className="w-8 h-8 rounded-full object-cover" 
                      />
                    ) : (
                      <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center text-xs">
                        {referee.first_name?.[0]}{referee.last_name?.[0]}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{referee.first_name} {referee.last_name}</td>
                  <td className="px-4 py-3">{categoryMap[referee.category as keyof typeof categoryMap] || referee.category}</td>
                  <td className="px-4 py-3">{referee.region || '-'}</td>
                  <td className="px-4 py-3">{referee.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      referee.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {referee.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(referee)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(referee)} className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/60">Судьи не найдены</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingReferee(null); }}
        title={editingReferee ? 'Редактировать судью' : 'Добавить судью'}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Категория *</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="input w-full" required>
                    {Object.entries(categoryMap).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Регион</label>
                  <input type="text" value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} className="input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Опыт (месяцы)</label>
                  <input type="number" min="0" value={formData.experience_months} onChange={(e) => setFormData({ ...formData, experience_months: parseInt(e.target.value) || 0 })} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Телефон</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input w-full" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Национальность</label>
                <input type="text" value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} className="input w-full" />
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
              <button type="button" onClick={() => { setIsModalOpen(false); setEditingReferee(null); }} className="btn btn-outline flex-1">
                Отмена
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setRefereeToDelete(null) }}
        onConfirm={confirmDelete}
        title="Подтверждение удаления"
        message={`Вы действительно хотите удалить судью ${refereeToDelete?.first_name} ${refereeToDelete?.last_name}?`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
        confirmFirst={true}
      />
    </div>
  )
} 