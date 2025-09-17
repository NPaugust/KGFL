"use client"
import { useState } from 'react'
import { useClubs } from '@/hooks/useClubs'
import { HexColorPicker } from 'react-colorful'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Club } from '@/types'
import { Loading } from '../Loading'
import { apiClient } from '@/services/api'
import Image from 'next/image'
import { Modal, ConfirmModal } from '../ui/Modal'

interface ClubFormData {
  name: string
  city: string
  founded?: number
  primary_kit_color?: string
  secondary_kit_color?: string
  coach_full_name: string
  assistant_full_name: string
  captain_full_name?: string
  contact_phone: string
  contact_email?: string
  social_media?: string
  description?: string
  participation_fee: 'yes' | 'no' | 'partial'
  status: 'applied' | 'active' | 'disqualified' | 'withdrawn'
  website?: string
  logo?: File
}

const statusMap = {
  applied: 'Заявлен',
  active: 'Активен',
  disqualified: 'Дисквалифицирован',
  withdrawn: 'Выбыл',
};

export function ClubsManager() {
  const { clubs, clubsLoading, refetchClubs } = useClubs()
  const [showPrimaryPicker, setShowPrimaryPicker] = useState(false)
  const [showSecondaryPicker, setShowSecondaryPicker] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClub, setEditingClub] = useState<Club | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [clubToDelete, setClubToDelete] = useState<Club | null>(null)
  const [formData, setFormData] = useState<ClubFormData>({
    name: '',
    city: '',
    founded: undefined,
    primary_kit_color: '',
    secondary_kit_color: '',
    coach_full_name: '',
    assistant_full_name: '',
    captain_full_name: '',
    contact_phone: '',
    contact_email: '',
    social_media: '',
    description: '',
    participation_fee: 'no',
    status: 'applied',
    website: ''
  })

  const createClubMutation = useApiMutation()
  const updateClubMutation = useApiMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = new FormData()
      payload.append('name', formData.name)
      payload.append('city', formData.city)
      payload.append('founded', formData.founded ? String(formData.founded) : '')
      payload.append('primary_kit_color', formData.primary_kit_color || '')
      payload.append('secondary_kit_color', formData.secondary_kit_color || '')
      payload.append('coach_full_name', formData.coach_full_name)
      payload.append('assistant_full_name', formData.assistant_full_name)
      payload.append('captain_full_name', formData.captain_full_name || '')
      payload.append('contact_phone', formData.contact_phone)
      payload.append('contact_email', formData.contact_email || '')
      payload.append('social_media', formData.social_media || '')
      payload.append('description', formData.description || '')
      payload.append('participation_fee', formData.participation_fee)
      payload.append('status', formData.status)
      payload.append('website', formData.website || '')
      if (formData.logo instanceof File) {
        payload.append('logo', formData.logo)
      }

      if (editingClub) {
        await updateClubMutation.mutateAsync(API_ENDPOINTS.CLUB_DETAIL(editingClub.id), 'PATCH', payload)
      } else {
        await createClubMutation.mutateAsync(API_ENDPOINTS.CLUBS, 'POST', payload)
      }
      
      setIsModalOpen(false)
      setEditingClub(null)
      
      // Сбрасываем formData только при создании нового клуба
      if (!editingClub) {
        setFormData({ 
          name: '', city: '', founded: undefined, primary_kit_color: '', 
          secondary_kit_color: '', coach_full_name: '', assistant_full_name: '', 
          captain_full_name: '', contact_phone: '', contact_email: '', 
          social_media: '', description: '', participation_fee: 'no', 
          status: 'applied', website: '' 
        })
      }
      
      refetchClubs()
      
      // Отправляем событие обновления данных
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { type: 'club' } 
      }))
    } catch (error) {
      console.error('Ошибка при сохранении клуба:', error)
      alert('Ошибка при сохранении клуба')
    }
  }

  const handleCreateClick = () => {
    setEditingClub(null)
    // Принудительно сбрасываем все данные формы
    setFormData({
      name: '',
      city: '',
      founded: undefined,
      primary_kit_color: '',
      secondary_kit_color: '',
      coach_full_name: '',
      assistant_full_name: '',
      captain_full_name: '',
      contact_phone: '',
      contact_email: '',
      social_media: '',
      description: '',
      participation_fee: 'no',
      status: 'applied',
      website: '',
      logo: undefined
    })
    setIsModalOpen(true)
  }

  const handleEdit = (club: Club) => {
    setEditingClub(club)
    setFormData({
      name: club.name || '',
      city: club.city || '',
      founded: club.founded,
      primary_kit_color: club.primary_kit_color || '',
      secondary_kit_color: club.secondary_kit_color || '',
      coach_full_name: club.coach_full_name || '',
      assistant_full_name: club.assistant_full_name || '',
      captain_full_name: club.captain_full_name || '',
      contact_phone: club.contact_phone || '',
      contact_email: club.contact_email || '',
      social_media: club.social_media || '',
      description: club.description || '',
      participation_fee: (club.participation_fee || 'no') as any,
      status: (club.status || 'applied') as any,
      website: club.website || '',
      logo: undefined, // Файл не префиллим при редактировании
    })
    setIsModalOpen(true)
  }

  const handleDelete = (club: Club) => {
    setClubToDelete(club)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!clubToDelete) return
    
    try {
      await apiClient.delete(API_ENDPOINTS.CLUB_DETAIL(clubToDelete.id))
      refetchClubs()
      setDeleteModalOpen(false)
      setClubToDelete(null)
    } catch (error: any) {
      alert(`Ошибка при удалении клуба: ${error?.response?.data?.detail || error?.message || 'Неизвестная ошибка'}`)
    }
  }

  if (clubsLoading) {
    return <Loading />
  }

  const clubsList = Array.isArray(clubs) ? clubs : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление клубами</h1>
        <button onClick={handleCreateClick} className="btn btn-primary">Добавить клуб</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Логотип</th>
                <th className="px-4 py-3 text-left">Название</th>
                <th className="px-4 py-3 text-left">Город</th>
                <th className="px-4 py-3 text-left">Основан</th>
                <th className="px-4 py-3 text-left">Тренер</th>
                <th className="px-4 py-3 text-left">Телефон</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {clubsList.length > 0 ? clubsList.map((club) => (
                <tr key={club.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {club.logo ? (
                      <Image src={club.logo} alt={club.name} width={64} height={64} className="w-16 h-16 rounded-lg object-contain bg-white/10 p-1" />
                    ) : (
                      <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center text-white/40 text-sm">Нет лого</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{club.name}</td>
                  <td className="px-4 py-3">{club.city}</td>
                  <td className="px-4 py-3">{club.founded || '-'}</td>
                  <td className="px-4 py-3">{club.coach_full_name || '-'}</td>
                  <td className="px-4 py-3">{club.contact_phone || '-'}</td>
                  <td className="px-4 py-3">{statusMap[club.status as keyof typeof statusMap] || club.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(club)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(club)} className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-white/60">Клубы не найдены</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { 
          setIsModalOpen(false); 
          setEditingClub(null); 
          setFormData({
            name: '',
            city: '',
            founded: undefined,
            primary_kit_color: '',
            secondary_kit_color: '',
            coach_full_name: '',
            assistant_full_name: '',
            captain_full_name: '',
            contact_phone: '',
            contact_email: '',
            social_media: '',
            description: '',
            participation_fee: 'no',
            status: 'applied',
            website: '',
            logo: undefined
          });
        }}
        title={editingClub ? 'Редактировать клуб' : 'Добавить клуб'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Название *</label>
                  <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="input w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Город / регион</label>
                  <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Год основания</label>
                  <input type="number" value={formData.founded || ''} onChange={(e) => setFormData({ ...formData, founded: parseInt(e.target.value) || undefined })} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Веб‑сайт</label>
                  <input type="url" value={formData.website || ''} onChange={(e) => setFormData({ ...formData, website: e.target.value })} className="input w-full" />
                </div>
              </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Цвет формы (основная)</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={()=>setShowPrimaryPicker(!showPrimaryPicker)}
                      className="inline-block h-8 w-10 rounded-full border border-white/20"
                      style={{ backgroundColor: formData.primary_kit_color || '#FFFFFF' }}
                      aria-label="Выбрать основной цвет"
                    />
                    <input
                      type="text"
                      value={formData.primary_kit_color || ''}
                      onChange={(e) => setFormData({ ...formData, primary_kit_color: e.target.value })}
                      className="input w-full"
                      placeholder="#FFCC00"
                    />
                  </div>
                  {/* Убрали пресеты цветов */}
                  {showPrimaryPicker && (
                    <div className="absolute z-50 mt-2 p-3 rounded-lg border border-white/10 bg-gray-900 shadow-xl">
                      <HexColorPicker color={formData.primary_kit_color || '#FFFFFF'} onChange={(hex)=>setFormData({...formData, primary_kit_color: hex})} />
                    </div>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Цвет формы (запасная)</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={()=>setShowSecondaryPicker(!showSecondaryPicker)}
                      className="inline-block h-8 w-10 rounded-full border border-white/20"
                      style={{ backgroundColor: formData.secondary_kit_color || '#000000' }}
                      aria-label="Выбрать запасной цвет"
                    />
                    <input
                      type="text"
                      value={formData.secondary_kit_color || ''}
                      onChange={(e) => setFormData({ ...formData, secondary_kit_color: e.target.value })}
                      className="input w-full"
                      placeholder="#000000"
                    />
                  </div>
                  {/* Убрали пресеты цветов */}
                  {showSecondaryPicker && (
                    <div className="absolute z-50 mt-2 p-3 rounded-lg border border-white/10 bg-gray-900 shadow-xl">
                      <HexColorPicker color={formData.secondary_kit_color || '#000000'} onChange={(hex)=>setFormData({...formData, secondary_kit_color: hex})} />
                    </div>
                  )}
                </div>
              </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Тренер (ФИО) *</label>
                  <input type="text" value={formData.coach_full_name} onChange={(e) => setFormData({ ...formData, coach_full_name: e.target.value })} className="input w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ассистент / Менеджер *</label>
                  <input type="text" value={formData.assistant_full_name} onChange={(e) => setFormData({ ...formData, assistant_full_name: e.target.value })} className="input w-full" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Капитан</label>
                  <input type="text" value={formData.captain_full_name || ''} onChange={(e) => setFormData({ ...formData, captain_full_name: e.target.value })} className="input w-full" />
                </div>
              </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Телефон</label>
                  <input type="tel" pattern="^[+\d][\d\s()-]{6,}$" title="Например: +996 700 123 456" value={formData.contact_phone} onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input type="email" value={formData.contact_email || ''} onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })} className="input w-full" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Соцсети (URL)</label>
                  <input type="url" pattern="https?://.+" title="Полный URL, например: https://instagram.com/club" value={formData.social_media || ''} onChange={(e) => setFormData({ ...formData, social_media: e.target.value })} className="input w-full" placeholder="https://instagram.com/club" />
                </div>
              </div>

          <div>
            <label className="block text-sm font-medium mb-2">Описание</label>
            <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="textarea w-full" rows={3} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Взнос на участие *</label>
                  <select value={formData.participation_fee} onChange={(e) => setFormData({ ...formData, participation_fee: e.target.value as any })} className="input w-full" required>
                    <option value="yes">Есть</option>
                    <option value="no">Нет</option>
                    <option value="partial">Частично</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Статус команды</label>
                  <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as any })} className="input w-full">
                    {Object.entries(statusMap).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Логотип</label>
                  <input type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={(e) => setFormData({ ...formData, logo: e.target.files?.[0] })} className="input w-full" />
                </div>
              </div>

          <div className="flex gap-4 pt-5 border-t border-white/10">
            <button type="submit" className="btn btn-primary flex-1" disabled={createClubMutation.loading || updateClubMutation.loading}>
              {createClubMutation.loading || updateClubMutation.loading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button type="button" onClick={() => { 
              setIsModalOpen(false); 
              setEditingClub(null); 
              setFormData({
                name: '',
                city: '',
                founded: undefined,
                primary_kit_color: '',
                secondary_kit_color: '',
                coach_full_name: '',
                assistant_full_name: '',
                captain_full_name: '',
                contact_phone: '',
                contact_email: '',
                social_media: '',
                description: '',
                participation_fee: 'no',
                status: 'applied',
                website: '',
                logo: undefined
              });
            }} className="btn btn-outline flex-1">
              Отмена
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setClubToDelete(null) }}
        onConfirm={confirmDelete}
        title="Подтверждение удаления"
        message={`Вы действительно хотите удалить клуб "${clubToDelete?.name}"?`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
        confirmFirst={true}
      />
    </div>
  )
} 