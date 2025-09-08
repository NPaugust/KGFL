"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import { Modal } from '../ui/Modal'

interface StadiumFormData {
  name: string
  city?: string
  capacity?: number
  address?: string
}

interface Stadium {
  id: string
  name: string
  city?: string
  capacity?: number
  address?: string
}

export function StadiumsManager() {
  const { data: stadiums, loading, error, refetch } = useApi<Stadium[]>(API_ENDPOINTS.STADIUMS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Stadium | null>(null)
  const [formData, setFormData] = useState<StadiumFormData>({ name: '', city: '', capacity: undefined, address: '' })

  const createMutation = useApiMutation()
  const updateMutation = useApiMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload: any = {
      name: formData.name,
      city: formData.city || '',
      capacity: formData.capacity || null,
      address: formData.address || ''
    }

    if (editing) {
      await updateMutation.mutateAsync(API_ENDPOINTS.STADIUMS + editing.id + '/', 'PUT', payload)
    } else {
      await createMutation.mutateAsync(API_ENDPOINTS.STADIUMS, 'POST', payload)
    }
    setIsModalOpen(false)
    setEditing(null)
    
    // Сбрасываем formData только при создании нового стадиона
    if (!editing) {
      setFormData({ name: '', city: '', capacity: undefined, address: '' })
    }
    refetch()
    
    // Отправляем событие обновления данных
    window.dispatchEvent(new CustomEvent('data-refresh', { 
      detail: { type: 'stadium' } 
    }))
  }

  if (loading) return <Loading />

  const list = Array.isArray(stadiums) ? stadiums : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Стадионы</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">Добавить стадион</button>
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
                      <button onClick={() => { setEditing(s); setFormData({ name: s.name, city: s.city, capacity: s.capacity, address: s.address }) ; setIsModalOpen(true) }} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
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
        onClose={() => { setIsModalOpen(false); setEditing(null); }}
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
              <button type="submit" className="btn btn-primary flex-1">Сохранить</button>
              <button type="button" onClick={() => { setIsModalOpen(false); setEditing(null); }} className="btn btn-outline flex-1">Отмена</button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}
