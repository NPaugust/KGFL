"use client"
import { useState, useMemo } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import Image from 'next/image'
import { getImageUrl } from '@/utils'
import { Modal, ConfirmModal } from '../ui/Modal'
import { Search } from '@/components/Search'

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
  const [activeRefereeTab, setActiveRefereeTab] = useState<'general' | 'details' | 'media'>('general')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const { mutate, loading: mutationLoading } = useApiMutation()
  const refereeModalTabs: { id: 'general' | 'details' | 'media'; label: string; description: string }[] = [
    { id: 'general', label: 'Основное', description: 'Имя, фамилия, категория' },
    { id: 'details', label: 'Контакты', description: 'Регион, опыт, телефон, статус' },
    { id: 'media', label: 'Медиа', description: 'Фото судьи' }
  ]

  const handleCreateClick = () => {
    setEditingReferee(null);
    setFormData(initialFormData);
    setActiveRefereeTab('general')
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
      setActiveRefereeTab('general')
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
      alert('Ошибка при сохранении судьи')
    }
  }

  const handleEdit = (referee: any) => {
    setEditingReferee(referee)
    setActiveRefereeTab('general')
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

  const refereesList = useMemo(() => Array.isArray(referees) ? referees : [], [referees])

  const filteredReferees = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    
    return refereesList.filter((referee: any) => {
      if (normalizedSearch) {
        const haystack = `${referee.first_name ?? ''} ${referee.last_name ?? ''} ${referee.region ?? ''} ${referee.phone ?? ''}`.toLowerCase()
        if (!haystack.includes(normalizedSearch)) {
          return false
        }
      }
      
      if (categoryFilter && referee.category !== categoryFilter) {
        return false
      }
      
      if (statusFilter !== null) {
        const isActive = referee.is_active !== false
        if (statusFilter === 'active' && !isActive) return false
        if (statusFilter === 'inactive' && isActive) return false
      }
      
      return true
    })
  }, [refereesList, searchTerm, categoryFilter, statusFilter])

  if (loading) {
    return <Loading />
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Управление судьями</h1>
          <button onClick={handleCreateClick} className="btn btn-primary whitespace-nowrap">Добавить судью</button>
        </div>
        
        <div className="card bg-white/5 border border-white/10 p-4 rounded-none">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search
                placeholder="Поиск по имени, региону, телефону..."
                onSearch={setSearchTerm}
                className="w-full"
                hideIcon
                square
                initialValue={searchTerm}
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input !rounded-none appearance-none h-10"
            >
              <option value="">Все категории</option>
              {Object.entries(categoryMap).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className="input !rounded-none appearance-none h-10"
            >
              <option value="">Все статусы</option>
              <option value="active">Активен</option>
              <option value="inactive">Неактивен</option>
            </select>
            {(searchTerm || categoryFilter || statusFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter('')
                  setStatusFilter(null)
                }}
                className="btn btn-outline whitespace-nowrap !rounded-none h-10 px-4"
              >
                Сбросить
              </button>
            )}
          </div>
        </div>
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
              {filteredReferees.length > 0 ? filteredReferees.map((referee) => (
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
                  <td colSpan={7} className="px-4 py-8 text-center text-white/60">
                    {refereesList.length === 0 ? 'Судьи не найдены' : 'Нет результатов по заданным фильтрам'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingReferee(null)
          setFormData(initialFormData)
          setActiveRefereeTab('general')
        }}
        title={editingReferee ? 'Редактировать судью' : 'Добавить судью'}
        size="lg"
        className="max-w-4xl"
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              {refereeModalTabs.map((tab) => {
                const isActive = activeRefereeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveRefereeTab(tab.id)}
                    className={`px-4 py-2 rounded-xl border transition-all text-sm font-medium ${
                      isActive
                        ? 'border-brand-primary bg-brand-primary/20 text-brand-primary shadow-[0_0_20px_rgba(0,140,255,0.2)]'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div>{tab.label}</div>
                    <div className="text-xs text-white/50 font-normal">{tab.description}</div>
                  </button>
                )
              })}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              {activeRefereeTab === 'general' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Имя *</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="input w-full"
                        placeholder="Имя"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Фамилия *</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="input w-full"
                        placeholder="Фамилия"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Категория *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input w-full"
                      required
                    >
                      {Object.entries(categoryMap).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {activeRefereeTab === 'details' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Регион</label>
                      <input
                        type="text"
                        value={formData.region}
                        onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                        className="input w-full"
                        placeholder="Регион"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Опыт (месяцы)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.experience_months}
                        onChange={(e) =>
                          setFormData({ ...formData, experience_months: parseInt(e.target.value, 10) || 0 })
                        }
                        className="input w-full"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Телефон</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="input w-full"
                        placeholder="Контактный номер"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Национальность</label>
                      <input
                        type="text"
                        value={formData.nationality}
                        onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                        className="input w-full"
                        placeholder="Страна"
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Активен
                  </label>
                </div>
              )}

              {activeRefereeTab === 'media' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Фото</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] })}
                      className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30"
                    />
                    {!editingReferee && (
                      <div className="text-xs text-white/60 mt-2">Фото обязательно при создании нового судьи.</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:gap-4 pt-4 border-t border-white/10">
              <button type="submit" className="flex-1 btn btn-primary h-12" disabled={mutationLoading}>
                {mutationLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingReferee(null)
                  setFormData(initialFormData)
                  setActiveRefereeTab('general')
                }}
                className="flex-1 btn btn-outline h-12"
              >
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