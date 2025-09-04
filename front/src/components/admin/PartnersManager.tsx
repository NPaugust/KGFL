"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import { getImageUrl } from '@/utils'

interface Partner {
  id: string
  name: string
  logo?: string
  category: string
  website?: string
  created_at: string
}

interface PartnerFormData {
  name: string
  category: 'main' | 'official' | 'technical'
  website?: string
  logo?: File
}

export function PartnersManager() {
  const { data: partners, loading, error, refetch } = useApi<Partner[]>(API_ENDPOINTS.PARTNERS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null)
  const [formData, setFormData] = useState<PartnerFormData>({ name: '', category: 'official', website: '' })
  const { mutate, loading: mutationLoading } = useApiMutation<Partner>()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const fd = new FormData()
      fd.append('name', formData.name)
      fd.append('category', formData.category)
      if (formData.website) fd.append('website', formData.website)
      if (formData.logo) fd.append('logo', formData.logo)
      if (editingPartner) {
        await mutate(API_ENDPOINTS.PARTNER_DETAIL(editingPartner.id), 'PUT', fd)
      } else {
        await mutate(API_ENDPOINTS.PARTNERS, 'POST', fd)
      }
      setIsModalOpen(false)
      setEditingPartner(null)
      setFormData({ name: '', category: 'official', website: '' })
      refetch()
    } catch (error) {
      alert(`Ошибка при сохранении партнера`)
    }
  }

  const handleEdit = (partner: Partner) => {
    setEditingPartner(partner)
    const safeCategory = (['main','official','technical'] as const).includes(partner.category as any)
      ? (partner.category as 'main'|'official'|'technical')
      : 'official'
    setFormData({ name: partner.name || '', category: safeCategory, website: partner.website || '' })
    setIsModalOpen(true)
  }

  const handleDelete = async (partnerId: string) => {
    if (confirm('Вы уверены, что хотите удалить этого партнера?')) {
      try {
        await mutate(API_ENDPOINTS.PARTNER_DETAIL(partnerId), 'DELETE')
        refetch()
      } catch (error) {
        alert('Ошибка при удалении партнера')
      }
    }
  }

  if (loading) return <Loading />
  const partnersList = Array.isArray(partners) ? partners : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление партнерами лиги</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">Добавить партнера</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Логотип</th>
                <th className="px-4 py-3 text-left">Название</th>
                <th className="px-4 py-3 text-left">Категория</th>
                <th className="px-4 py-3 text-left">Веб-сайт</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {partnersList.length > 0 ? partnersList.map((p) => (
                <tr key={p.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {p.logo ? (
                      <img src={getImageUrl(p.logo)} alt={p.name} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center"><span className="text-white/40 text-xs">Нет</span></div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3">{p.website ? <a href={p.website} target="_blank" rel="noopener noreferrer" className="text-brand-primary hover:underline">{p.website}</a> : '-'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(p)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(p.id)} className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/60">Партнеры не найдены</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingPartner ? 'Редактировать партнера' : 'Добавить партнера'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Категория *</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as any })} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded" required>
                  <option value="main">Главный партнер</option>
                  <option value="official">Официальный партнер</option>
                  <option value="technical">Технический партнер</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Веб‑сайт</label>
                <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded" placeholder="https://example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Логотип</label>
                <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, logo: e.target.files?.[0] })} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="btn btn-primary flex-1" disabled={mutationLoading}>{mutationLoading ? 'Сохранение...' : 'Сохранить'}</button>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingPartner(null); setFormData({ name: '', category: 'official', website: '' }) }} className="btn btn-outline flex-1">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 