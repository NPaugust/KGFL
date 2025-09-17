"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import Image from 'next/image'
import { Modal, ConfirmModal } from '../ui/Modal'

interface PartnerFormData {
  name: string
  description: string
  website: string
  logo?: File
  contact_person: string
  contact_email: string
  contact_phone: string
  partnership_type: string
  is_active: boolean
}

export function PartnersManager() {
  const { data: partners, loading, error, refetch } = useApi<any[]>(API_ENDPOINTS.PARTNERS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<any | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [partnerToDelete, setPartnerToDelete] = useState<any | null>(null)
  const [formData, setFormData] = useState<PartnerFormData>({
    name: '',
    description: '',
    website: '',
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    partnership_type: 'sponsor',
    is_active: true
  })

  const { mutate, loading: mutationLoading } = useApiMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = new FormData()
      payload.append('name', formData.name)
      payload.append('description', formData.description || '')
      payload.append('website', formData.website || '')
      payload.append('contact_person', formData.contact_person || '')
      payload.append('contact_email', formData.contact_email || '')
      payload.append('contact_phone', formData.contact_phone || '')
      payload.append('partnership_type', formData.partnership_type)
      payload.append('is_active', String(formData.is_active))
      if (formData.logo) payload.append('logo', formData.logo)

      if (editingPartner) {
        await mutate(API_ENDPOINTS.PARTNER_DETAIL(editingPartner.id), 'PATCH', payload)
      } else {
        await mutate(API_ENDPOINTS.PARTNERS, 'POST', payload)
      }

      setIsModalOpen(false)
      setEditingPartner(null)
      
      // Сбрасываем formData только при создании нового партнера
      if (!editingPartner) {
        setFormData({
          name: '',
          description: '',
          website: '',
          contact_person: '',
          contact_email: '',
          contact_phone: '',
          partnership_type: 'sponsor',
          is_active: true
        })
      }
      refetch()
      
      // Отправляем событие обновления данных
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { type: 'partner' } 
      }))
    } catch (error) {
      console.error('Ошибка при сохранении партнера:', error)
      alert('Ошибка при сохранении партнера')
    }
  }

  const handleCreateClick = () => {
    setEditingPartner(null)
    // Принудительно сбрасываем все данные формы
    setFormData({
      name: '',
      description: '',
      website: '',
      contact_person: '',
      contact_email: '',
      contact_phone: '',
      partnership_type: 'sponsor',
      is_active: true,
      logo: undefined
    })
    setIsModalOpen(true)
  }

  const handleEdit = (partner: any) => {
    setEditingPartner(partner)
    setFormData({
      name: partner.name || '',
      description: partner.description || '',
      website: partner.website || '',
      contact_person: partner.contact_person || '',
      contact_email: partner.contact_email || '',
      contact_phone: partner.contact_phone || '',
      partnership_type: partner.partnership_type || 'sponsor',
      is_active: partner.is_active !== false
    })
    setIsModalOpen(true)
  }

  const handleDelete = (partner: any) => {
    setPartnerToDelete(partner)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!partnerToDelete) return
    
    try {
      await mutate(API_ENDPOINTS.PARTNER_DETAIL(partnerToDelete.id), 'DELETE')
      refetch()
      setDeleteModalOpen(false)
      setPartnerToDelete(null)
    } catch (error: any) {
      alert(`Ошибка при удалении партнера: ${error?.response?.data?.detail || error?.message || 'Неизвестная ошибка'}`)
    }
  }

  if (loading) {
    return <Loading />
  }

  const partnersList = Array.isArray(partners) ? partners : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Управление партнерами</h1>
        <button onClick={handleCreateClick} className="btn btn-primary">Добавить партнера</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Логотип</th>
                <th className="px-4 py-3 text-left">Название</th>
                <th className="px-4 py-3 text-left">Тип</th>
                <th className="px-4 py-3 text-left">Контакт</th>
                <th className="px-4 py-3 text-left">Веб-сайт</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {partnersList.length > 0 ? partnersList.map((partner) => (
                <tr key={partner.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {partner.logo_url || partner.logo ? (
                      <Image 
                        src={partner.logo_url || partner.logo} 
                        alt={partner.name} 
                        width={64} 
                        height={64} 
                        className="w-16 h-16 rounded object-contain bg-white/5" 
                      />
                    ) : (
                      <div className="w-16 h-16 bg-white/10 rounded flex items-center justify-center text-lg">
                        {partner.name?.[0]}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{partner.name}</td>
                  <td className="px-4 py-3">{partner.partnership_type}</td>
                  <td className="px-4 py-3">{partner.contact_person || '-'}</td>
                  <td className="px-4 py-3">{partner.website ? <a href={partner.website} target="_blank" rel="noopener noreferrer" className="link">Сайт</a> : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      partner.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {partner.is_active ? 'Активен' : 'Неактивен'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(partner)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(partner)} className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/60">Партнеры не найдены</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPartner(null); }}
        title={editingPartner ? 'Редактировать партнера' : 'Добавить партнера'}
        size="md"
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input w-full" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="textarea w-full" rows={3} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Веб-сайт</label>
                <input type="url" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="input w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Тип партнерства *</label>
                <select value={formData.partnership_type} onChange={(e) => setFormData({ ...formData, partnership_type: e.target.value })} className="input w-full" required>
                  <option value="sponsor">Спонсор</option>
                  <option value="partner">Партнер</option>
                  <option value="supplier">Поставщик</option>
                  <option value="media">Медиа-партнер</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Контактное лицо</label>
                <input type="text" value={formData.contact_person} onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })} className="input w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" value={formData.contact_email} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} className="input w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Телефон</label>
                <input type="tel" value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} className="input w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Логотип</label>
                <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, logo: e.target.files?.[0] })} className="input w-full" />
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
              <button type="button" onClick={() => { setIsModalOpen(false); setEditingPartner(null); }} className="btn btn-outline flex-1">
                Отмена
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setPartnerToDelete(null) }}
        onConfirm={confirmDelete}
        title="Подтверждение удаления"
        message={`Вы действительно хотите удалить партнера "${partnerToDelete?.name}"?`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
        confirmFirst={true}
      />
    </div>
  )
}