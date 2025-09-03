"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'

interface RefereeFormData {
  first_name: string
  last_name: string
  category: 'international' | 'national' | 'regional'
  region?: string
  experience_months: number
  phone?: string
  photo?: File
}

export function RefereesManager() {
  const { data: referees, loading, refetch } = useApi(API_ENDPOINTS.REFEREES)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReferee, setEditingReferee] = useState<any>(null)
  const [formData, setFormData] = useState<RefereeFormData>({
    first_name: '',
    last_name: '',
    category: 'national',
    region: '',
    experience_months: 0,
    phone: ''
  })
  const [formError, setFormError] = useState<string | null>(null)
  const [formSuccess, setFormSuccess] = useState<string | null>(null)

  const createRefereeMutation = useApiMutation()
  const updateRefereeMutation = useApiMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      setFormError(null)
      setFormSuccess(null)
      const fd = new FormData()
      fd.append('first_name', formData.first_name)
      fd.append('last_name', formData.last_name)
      fd.append('category', formData.category)
      if (formData.region) fd.append('region', formData.region)
      fd.append('experience_months', String(formData.experience_months))
      if (formData.phone) fd.append('phone', formData.phone)
      if (formData.photo) fd.append('photo', formData.photo)

      if (editingReferee) {
        await updateRefereeMutation.mutateAsync(API_ENDPOINTS.REFEREES_DETAIL(editingReferee.id), 'PUT', fd)
      } else {
        await createRefereeMutation.mutateAsync(API_ENDPOINTS.REFEREES, 'POST', fd)
      }

      setIsModalOpen(false)
      setEditingReferee(null)
      setFormData({ first_name: '', last_name: '', category: 'national', region: '', experience_months: 0, phone: '' })
      refetch()
      setFormSuccess('Сохранено')
    } catch (error) {
      const errorMessage = (error as any)?.response?.data?.message || (error instanceof Error ? error.message : 'Неизвестная ошибка')
      setFormError(errorMessage)
    }
  }

  const handleEdit = (referee: any) => {
    setEditingReferee(referee)
    setFormData({
      first_name: referee.first_name || '',
      last_name: referee.last_name || '',
      category: referee.category || 'national',
      region: referee.region || '',
      experience_months: referee.experience_months || 0,
      phone: referee.phone || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (refereeId: string) => {
    if (confirm('Вы уверены, что хотите удалить этого судью?')) {
      try {
        await updateRefereeMutation.mutateAsync(API_ENDPOINTS.REFEREES_DETAIL(refereeId), 'DELETE')
        refetch()
      } catch (error) {
        alert(`Ошибка при удалении судьи`)
      }
    }
  }

  if (loading) {
    return <Loading />
  }

  const refereesList = Array.isArray(referees) ? referees : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление судьями</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">Добавить судью</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Фото</th>
                <th className="px-4 py-3 text-left">ФИО</th>
                <th className="px-4 py-3 text-left">Категория</th>
                <th className="px-4 py-3 text-left">Регион</th>
                <th className="px-4 py-3 text-left">Опыт (мес)</th>
                <th className="px-4 py-3 text-left">Телефон</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {refereesList.length > 0 ? refereesList.map((ref: any) => (
                <tr key={ref.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {ref.photo ? (
                      <img src={ref.photo.startsWith('http') ? ref.photo : `/${ref.photo}`} alt={`${ref.first_name} ${ref.last_name}`} className="w-8 h-8 rounded" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-500 rounded flex items-center justify-center text-xs">
                        {(ref.first_name?.[0] || '') + (ref.last_name?.[0] || '')}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{ref.first_name} {ref.last_name}</td>
                  <td className="px-4 py-3">{ref.category}</td>
                  <td className="px-4 py-3">{ref.region || '-'}</td>
                  <td className="px-4 py-3">{ref.experience_months ?? 0}</td>
                  <td className="px-4 py-3">{ref.phone || '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(ref)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(ref.id)} className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm">Удалить</button>
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

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingReferee ? 'Редактировать судью' : 'Добавить судью'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && <div className="text-red-400 text-sm">{formError}</div>}
              {formSuccess && <div className="text-green-400 text-sm">{formSuccess}</div>}

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
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as any })} className="input w-full" required>
                    <option value="international">Международный</option>
                    <option value="national">Национальный</option>
                    <option value="regional">Региональный</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Регион / город</label>
                  <input type="text" value={formData.region || ''} onChange={(e) => setFormData({ ...formData, region: e.target.value })} className="input w-full" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Опыт (месяцы) *</label>
                  <input type="number" min="0" value={formData.experience_months} onChange={(e) => setFormData({ ...formData, experience_months: parseInt(e.target.value) || 0 })} className="input w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Телефон</label>
                  <input type="tel" value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="input w-full" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Фото</label>
                <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] })} className="input w-full" />
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" className="btn btn-primary flex-1" disabled={createRefereeMutation.loading || updateRefereeMutation.loading}>{createRefereeMutation.loading || updateRefereeMutation.loading ? 'Сохранение...' : 'Сохранить'}</button>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingReferee(null); setFormData({ first_name: '', last_name: '', category: 'national', region: '', experience_months: 0, phone: '' }) }} className="btn btn-outline flex-1">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 