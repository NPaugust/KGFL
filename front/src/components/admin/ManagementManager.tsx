"use client"
import { useEffect, useMemo, useState } from 'react'
import { API_ENDPOINTS } from '@/services/api'
import { Manager } from '@/types'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { Loading } from '../Loading'
import Image from 'next/image'
import { getImageUrl } from '@/utils'
import { Modal, ConfirmModal } from '../ui/Modal'
import { PaginationControls, DEFAULT_PAGE_SIZE } from './PaginationControls'

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

const ITEMS_PER_PAGE = DEFAULT_PAGE_SIZE

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
  const [activeManagerTab, setActiveManagerTab] = useState<'general' | 'contacts' | 'bio'>('general')
  const [currentPage, setCurrentPage] = useState(1)

  const { mutate, loading: mutationLoading } = useApiMutation<Manager>()
  const managerModalTabs: { id: 'general' | 'contacts' | 'bio'; label: string; description: string }[] = [
    { id: 'general', label: 'Основное', description: 'Имя и должность' },
    { id: 'contacts', label: 'Контакты', description: 'Email, телефон, порядок' },
    { id: 'bio', label: 'Биография', description: 'Описание и фото' }
  ]

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
      setIsModalOpen(false)
      setEditingManager(null)
      setActiveManagerTab('general')
      if (!editingManager) {
        setFormData({
          first_name: '',
          last_name: '',
          position: 'president',
          bio: '',
          email: '',
          phone: '',
          order: 0,
          is_active: true
        })
      }
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { type: 'management' } 
      }))
    } catch (error) {
      alert('Ошибка при сохранении сотрудника.');
    }
  }

  const handleCreateClick = () => {
    setEditingManager(null)
    setFormData({
      first_name: '',
      last_name: '',
      position: 'president',
      bio: '',
      email: '',
      phone: '',
      order: 0,
      is_active: true
    })
    setActiveManagerTab('general')
    setIsModalOpen(true)
  }

  const handleEdit = (manager: Manager) => {
    setEditingManager(manager);
    setActiveManagerTab('general')
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

  const managersList = useMemo(() => Array.isArray(management) ? management : [], [management])
  const totalManagers = managersList.length
  const totalManagerPages = Math.max(1, Math.ceil(totalManagers / ITEMS_PER_PAGE))
  const safeManagerPage = Math.min(currentPage, totalManagerPages)

  useEffect(() => {
    if (currentPage !== safeManagerPage) {
      setCurrentPage(safeManagerPage)
    }
  }, [currentPage, safeManagerPage])

  const paginatedManagers = useMemo(() => {
    const startIndex = (safeManagerPage - 1) * ITEMS_PER_PAGE
    return managersList.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [managersList, safeManagerPage])

  if (loading) {
    return <Loading />
  }

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
                <th className="px-4 py-3 text-left">Телефон</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginatedManagers.length > 0 ? paginatedManagers.map((manager) => (
                <tr key={manager.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {manager.photo_url || manager.photo ? (
                      <Image 
                        src={(manager.photo_url as string) || getImageUrl((manager.photo as string) || '')}
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
                  <td colSpan={6} className="px-4 py-8 text-center text-white/60">
                    {managersList.length === 0 ? 'Руководители не найдены' : 'Нет результатов для текущей страницы'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationControls
        page={safeManagerPage}
        pageSize={ITEMS_PER_PAGE}
        totalItems={totalManagers}
        onPageChange={setCurrentPage}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingManager(null)
          setActiveManagerTab('general')
          setFormData({
            first_name: '',
            last_name: '',
            position: 'president',
            bio: '',
            email: '',
            phone: '',
            order: 0,
            is_active: true
          })
        }}
        title={editingManager ? 'Редактировать руководителя' : 'Добавить руководителя'}
        size="lg"
        className="max-w-4xl"
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              {managerModalTabs.map((tab) => {
                const isActive = activeManagerTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveManagerTab(tab.id)}
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
              {activeManagerTab === 'general' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Имя *</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="input w-full"
                        required
                        placeholder="Имя"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Фамилия *</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="input w-full"
                        required
                        placeholder="Фамилия"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Должность *</label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="input w-full"
                      required
                    >
                      <option value="president">Президент</option>
                      <option value="vice_president">Вице-президент</option>
                      <option value="general_secretary">Генеральный секретарь</option>
                      <option value="director">Директор</option>
                      <option value="manager">Менеджер</option>
                    </select>
                  </div>
                </div>
              )}

              {activeManagerTab === 'contacts' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="input w-full"
                        placeholder="email@example.com"
                      />
                    </div>
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
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Порядок отображения</label>
                    <input
                      type="number"
                      min={0}
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })}
                      className="input w-full"
                    />
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

              {activeManagerTab === 'bio' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Биография</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="textarea w-full"
                      rows={4}
                      placeholder="Краткая информация о сотруднике"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Фото</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] })}
                      className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30"
                    />
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
                  setEditingManager(null)
                  setActiveManagerTab('general')
                  setFormData({
                    first_name: '',
                    last_name: '',
                    position: 'president',
                    bio: '',
                    email: '',
                    phone: '',
                    order: 0,
                    is_active: true
                  })
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