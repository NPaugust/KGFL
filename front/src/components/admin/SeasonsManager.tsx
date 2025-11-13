"use client"
import { useState, useMemo } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import { formatDate } from '@/utils'
import { Modal, ConfirmModal } from '../ui/Modal'
import { Search } from '@/components/Search'

interface SeasonFormData {
  name: string
  start_date: string
  end_date: string
  is_active: boolean
  description: string
  format: 'single' | 'groups'
}

export function SeasonsManager() {
  const { data: seasons, loading, error, refetch } = useApi<any[]>(API_ENDPOINTS.SEASONS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSeason, setEditingSeason] = useState<any | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [seasonToDelete, setSeasonToDelete] = useState<any | null>(null)
  const [formData, setFormData] = useState<SeasonFormData>({
    name: '',
    start_date: '',
    end_date: '',
    is_active: false,
    description: '',
    format: 'single'
  })
  const [activeSeasonTab, setActiveSeasonTab] = useState<'general' | 'options'>('general')
  const [searchTerm, setSearchTerm] = useState('')
  const [formatFilter, setFormatFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const { mutate, loading: mutationLoading } = useApiMutation()
  const seasonModalTabs: { id: 'general' | 'options'; label: string; description: string }[] = [
    { id: 'general', label: 'Основное', description: 'Название и даты' },
    { id: 'options', label: 'Настройки', description: 'Формат, описание, активность' }
  ]

  const handleCreateClick = () => {
    setEditingSeason(null)
    setFormData({
      name: '',
      start_date: '',
      end_date: '',
      is_active: false,
      description: '',
      format: 'single'
    })
    setActiveSeasonTab('general')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = {
        name: formData.name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_active: formData.is_active,
        description: formData.description || '',
        format: formData.format
      }

      if (editingSeason) {
        await mutate(API_ENDPOINTS.SEASON_DETAIL(editingSeason.id), 'PUT', payload)
      } else {
        await mutate(API_ENDPOINTS.SEASONS, 'POST', payload)
      }

      setIsModalOpen(false)
      setActiveSeasonTab('general')
      setEditingSeason(null)
      
      // Сбрасываем formData только при создании нового сезона
      if (!editingSeason) {
        setFormData({
          name: '',
          start_date: '',
          end_date: '',
          is_active: false,
          description: '',
          format: 'single'
        })
      }
      refetch()
      
      // Отправляем событие обновления данных
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { type: 'season' } 
      }))
    } catch (error) {
      alert('Ошибка при сохранении сезона')
    }
  }

  const handleEdit = (season: any) => {
    setEditingSeason(season)
    setActiveSeasonTab('general')
    setFormData({
      name: season.name || '',
      start_date: season.start_date ? new Date(season.start_date).toISOString().split('T')[0] : '',
      end_date: season.end_date ? new Date(season.end_date).toISOString().split('T')[0] : '',
      is_active: season.is_active || false,
      description: season.description || '',
      format: season.format || 'single'
    })
    setIsModalOpen(true)
  }

  const handleDelete = (season: any) => {
    setSeasonToDelete(season)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!seasonToDelete) return
    
    try {
      await mutate(API_ENDPOINTS.SEASON_DETAIL(seasonToDelete.id), 'DELETE')
      refetch()
      setDeleteModalOpen(false)
      setSeasonToDelete(null)
    } catch (error: any) {
      alert(`Ошибка при удалении сезона: ${error?.response?.data?.detail || error?.message || 'Неизвестная ошибка'}`)
    }
  }

  const handleSetActive = async (seasonId: string) => {
    try {
      await mutate(API_ENDPOINTS.SEASON_DETAIL(seasonId), 'PATCH', { is_active: true })
      refetch()
    } catch (error) {
      alert('Ошибка при активации сезона')
    }
  }

  const seasonsList = useMemo(() => Array.isArray(seasons) ? seasons : [], [seasons])

  const filteredSeasons = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    
    return seasonsList.filter((season: any) => {
      if (normalizedSearch) {
        const haystack = `${season.name ?? ''} ${season.description ?? ''}`.toLowerCase()
        if (!haystack.includes(normalizedSearch)) {
          return false
        }
      }
      
      if (formatFilter && season.format !== formatFilter) {
        return false
      }
      
      if (statusFilter !== null) {
        const isActive = season.is_active !== false
        if (statusFilter === 'active' && !isActive) return false
        if (statusFilter === 'inactive' && isActive) return false
      }
      
      return true
    })
  }, [seasonsList, searchTerm, formatFilter, statusFilter])

  if (loading) {
    return <Loading />
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Управление сезонами</h1>
          <button onClick={handleCreateClick} className="btn btn-primary whitespace-nowrap">Добавить сезон</button>
        </div>
        
        <div className="card bg-white/5 border border-white/10 p-4 rounded-none">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search
                placeholder="Поиск по названию, описанию..."
                onSearch={setSearchTerm}
                className="w-full"
                hideIcon
                square
                initialValue={searchTerm}
              />
            </div>
            <select
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              className="input !rounded-none appearance-none h-10"
            >
              <option value="">Все форматы</option>
              <option value="single">Одна таблица</option>
              <option value="groups">Групповой этап</option>
            </select>
            <select
              value={statusFilter || ''}
              onChange={(e) => setStatusFilter(e.target.value || null)}
              className="input !rounded-none appearance-none h-10"
            >
              <option value="">Все статусы</option>
              <option value="active">Активный</option>
              <option value="inactive">Неактивный</option>
            </select>
            {(searchTerm || formatFilter || statusFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setFormatFilter('')
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
                <th className="px-4 py-3 text-left">Название</th>
                <th className="px-4 py-3 text-left">Формат</th>
                <th className="px-4 py-3 text-left">Начало</th>
                <th className="px-4 py-3 text-left">Конец</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filteredSeasons.length > 0 ? filteredSeasons.map((season) => (
                <tr key={season.id} className="border-b border-white/10">
                  <td className="px-4 py-3 font-medium">{season.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      season.format === 'groups' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {season.format === 'groups' ? 'Групповой этап' : 'Одна таблица'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{season.start_date ? formatDate(season.start_date) : '-'}</td>
                  <td className="px-4 py-3">{season.end_date ? formatDate(season.end_date) : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      season.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {season.is_active ? 'Активный' : 'Неактивный'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {!season.is_active && (
                        <button onClick={() => handleSetActive(season.id)} className="btn btn-outline px-3 py-1 text-sm">Активировать</button>
                      )}
                      <button onClick={() => handleEdit(season)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(season)} className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/60">
                    {seasonsList.length === 0 ? 'Сезоны не найдены' : 'Нет результатов по заданным фильтрам'}
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
          setEditingSeason(null)
          setActiveSeasonTab('general')
          setFormData({
            name: '',
            start_date: '',
            end_date: '',
            is_active: false,
            description: '',
            format: 'single'
          })
        }}
        title={editingSeason ? 'Редактировать сезон' : 'Добавить сезон'}
        size="lg"
        className="max-w-4xl"
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              {seasonModalTabs.map((tab) => {
                const isActive = activeSeasonTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveSeasonTab(tab.id)}
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
              {activeSeasonTab === 'general' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Название сезона *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input w-full"
                      required
                      placeholder="Например, 2025/26"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Дата начала *</label>
                      <input
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Дата окончания *</label>
                      <input
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                        className="input w-full"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSeasonTab === 'options' && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Формат турнира *</label>
                    <select
                      value={formData.format}
                      onChange={(e) => setFormData({ ...formData, format: e.target.value as 'single' | 'groups' })}
                      className="input w-full"
                      required
                    >
                      <option value="single">Одна таблица</option>
                      <option value="groups">Групповой этап</option>
                    </select>
                    <p className="text-xs text-white/60 mt-1">
                      При выборе &quot;Групповой этап&quot; автоматически создаются 3 группы (A, B, C). Раздел «Клубы в сезонах» позволит
                      распределить команды вручную.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Описание</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="textarea w-full"
                      rows={4}
                      placeholder="Добавьте заметки о формате, регламенте или ограничениях"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Активный сезон
                  </label>
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
                  setEditingSeason(null)
                  setActiveSeasonTab('general')
                  setFormData({
                    name: '',
                    start_date: '',
                    end_date: '',
                    is_active: false,
                    description: '',
                    format: 'single'
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
        onClose={() => { setDeleteModalOpen(false); setSeasonToDelete(null) }}
        onConfirm={confirmDelete}
        title="Подтверждение удаления"
        message={`Вы действительно хотите удалить сезон "${seasonToDelete?.name}"?`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
        confirmFirst={true}
      />
    </div>
  )
}