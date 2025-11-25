"use client"
import { useEffect, useMemo, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import { formatDate } from '@/utils'
import { Modal, ConfirmModal } from '../ui/Modal'
import { Search } from '@/components/Search'
import { PaginationControls, DEFAULT_PAGE_SIZE } from './PaginationControls'
import { Player } from '@/types'

interface TransferFormData {
  player: string
  from_club: string
  to_club: string
  transfer_date: string
  transfer_fee: number | string
  status: string
  notes: string
  season: string
}

const initialFormData: TransferFormData = {
  player: '',
  from_club: '',
  to_club: '',
  transfer_date: new Date().toISOString().split('T')[0],
  transfer_fee: 0,
  status: 'pending',
  notes: '',
  season: ''
};

const statusMap = {
  pending: 'Ожидание',
  confirmed: 'Подтверждён',
  cancelled: 'Отменён',
};

const ITEMS_PER_PAGE = DEFAULT_PAGE_SIZE

export function TransfersManager() {
  const { data: transfers, loading, error, refetch } = useApi<any[]>(API_ENDPOINTS.PLAYER_TRANSFERS)
  const { data: players } = useApi<Player[]>(API_ENDPOINTS.PLAYERS)
  const { data: clubs } = useApi<any[]>(`${API_ENDPOINTS.CLUBS}?all=1`)
  const { data: seasons } = useApi<any[]>(API_ENDPOINTS.SEASONS)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTransfer, setEditingTransfer] = useState<any | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [transferToDelete, setTransferToDelete] = useState<any | null>(null)
  const [formData, setFormData] = useState<TransferFormData>(initialFormData)
  const [activeTransferTab, setActiveTransferTab] = useState<'general' | 'details' | 'notes'>('general')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [seasonFilter, setSeasonFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)

  const { mutate, loading: mutationLoading } = useApiMutation()
  const transferModalTabs: { id: 'general' | 'details' | 'notes'; label: string; description: string }[] = [
    { id: 'general', label: 'Основное', description: 'Игрок и клубы' },
    { id: 'details', label: 'Детали', description: 'Дата, сумма, статус, сезон' },
    { id: 'notes', label: 'Заметки', description: 'Комментарий по трансферу' }
  ]

useEffect(() => {
  setCurrentPage(1)
}, [searchTerm, statusFilter, seasonFilter])

  const availablePlayers = useMemo(() => {
    if (!formData.from_club || !players) return [];
    // Исправляем логику: players API возвращает только ID клуба для игрока
    return players.filter(p => p.club?.toString() === formData.from_club);
  }, [formData.from_club, players]);

  const handleCreateClick = () => {
    setEditingTransfer(null);
    setFormData(initialFormData);
    setActiveTransferTab('general')
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.from_club === formData.to_club) {
      alert('Клуб "Из" и клуб "В" не могут быть одинаковыми.');
      return;
    }
    try {
      // Автоматически устанавливаем текущий сезон если не указан
      const currentSeason = seasons?.find(s => s.is_active) || seasons?.[0]
      
      const payload = {
        player: parseInt(formData.player),
        from_club: formData.from_club ? parseInt(formData.from_club) : null,
        to_club: parseInt(formData.to_club),
        transfer_date: formData.transfer_date,
        transfer_fee: parseFloat(formData.transfer_fee?.toString() || '0') || 0,
        status: formData.status,
        notes: formData.notes || '',
        season: parseInt(formData.season || currentSeason?.id?.toString() || '1')
      }

      if (editingTransfer) {
        await mutate(API_ENDPOINTS.PLAYER_TRANSFER_DETAIL(editingTransfer.id), 'PATCH', payload)
      } else {
        await mutate(API_ENDPOINTS.PLAYER_TRANSFERS, 'POST', payload)
      }
      setIsModalOpen(false)
      setActiveTransferTab('general')
      refetch()
    } catch (error: any) {
      alert(`Ошибка: ${error.message || 'Не удалось сохранить трансфер'}`)
    }
  }

  const handleEdit = (transfer: any) => {
    setEditingTransfer(transfer)
    setActiveTransferTab('general')
    setFormData({
      player: transfer.player?.id.toString() || '',
      from_club: transfer.from_club?.id.toString() || '',
      to_club: transfer.to_club?.id.toString() || '',
      transfer_date: transfer.transfer_date ? new Date(transfer.transfer_date).toISOString().split('T')[0] : '',
      transfer_fee: transfer.transfer_fee || 0,
      status: transfer.status || 'pending',
      notes: transfer.notes || '',
      season: transfer.season?.toString() || ''
    })
    setIsModalOpen(true)
  }

  const handleDelete = (transfer: any) => {
    setTransferToDelete(transfer)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!transferToDelete) return
    try {
      await mutate(API_ENDPOINTS.PLAYER_TRANSFER_DETAIL(transferToDelete.id), 'DELETE')
      refetch()
      setDeleteModalOpen(false)
    } catch (error: any) {
      alert(`Ошибка при удалении трансфера: ${error?.response?.data?.detail || error?.message || 'Неизвестная ошибка'}`)
    }
  }

  const handleStatusChange = async (transferId: string, newStatus: string) => {
    try {
      await mutate(API_ENDPOINTS.PLAYER_TRANSFER_DETAIL(transferId), 'PATCH', { status: newStatus })
      refetch()
    } catch (error) {
      alert('Ошибка при изменении статуса')
    }
  }

  const transfersList = useMemo(() => Array.isArray(transfers) ? transfers : [], [transfers])
  const clubsList = useMemo(() => Array.isArray(clubs) ? clubs : [], [clubs])

  const filteredTransfers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    
    return transfersList.filter((transfer: any) => {
      if (normalizedSearch) {
        const playerName = transfer.player_full_name || `${transfer.player?.first_name || ''} ${transfer.player?.last_name || ''}`.trim()
        const haystack = `${playerName} ${transfer.from_club?.name || ''} ${transfer.to_club?.name || ''}`.toLowerCase()
        if (!haystack.includes(normalizedSearch)) {
          return false
        }
      }
      
      if (statusFilter && transfer.status !== statusFilter) {
        return false
      }
      
      if (seasonFilter) {
        const transferSeasonId = transfer.season?.toString() || transfer.season_id?.toString()
        if (transferSeasonId !== seasonFilter) {
          return false
        }
      }
      
      return true
    })
  }, [transfersList, searchTerm, statusFilter, seasonFilter])

const totalTransfers = filteredTransfers.length
const totalTransferPages = Math.max(1, Math.ceil(totalTransfers / ITEMS_PER_PAGE))
const safeTransferPage = Math.min(currentPage, totalTransferPages)

useEffect(() => {
  if (currentPage !== safeTransferPage) {
    setCurrentPage(safeTransferPage)
  }
}, [currentPage, safeTransferPage])

const paginatedTransfers = useMemo(() => {
  const startIndex = (safeTransferPage - 1) * ITEMS_PER_PAGE
  return filteredTransfers.slice(startIndex, startIndex + ITEMS_PER_PAGE)
}, [filteredTransfers, safeTransferPage])

  if (loading) return <Loading />

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Управление трансферами</h1>
          <button onClick={handleCreateClick} className="btn btn-primary whitespace-nowrap">Добавить трансфер</button>
        </div>
        
        <div className="card bg-white/5 border border-white/10 p-4 rounded-none">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search
                placeholder="Поиск по игроку, клубам..."
                onSearch={setSearchTerm}
                className="w-full"
                hideIcon
                square
                initialValue={searchTerm}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input !rounded-none appearance-none h-10"
            >
              <option value="">Все статусы</option>
              {Object.entries(statusMap).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="input !rounded-none appearance-none h-10"
            >
              <option value="">Все сезоны</option>
              {seasons?.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {(searchTerm || statusFilter || seasonFilter) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setStatusFilter('')
                  setSeasonFilter('')
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
                <th className="px-4 py-3 text-left">Игрок</th>
                <th className="px-4 py-3 text-left">Из клуба</th>
                <th className="px-4 py-3 text-left">В клуб</th>
                <th className="px-4 py-3 text-left">Дата</th>
                <th className="px-4 py-3 text-left">Сумма</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransfers.length > 0 ? paginatedTransfers.map((transfer) => (
                <tr key={transfer.id} className="border-b border-white/10">
                  <td className="px-4 py-3 font-medium">
                    {transfer.player_full_name || `${transfer.player?.first_name} ${transfer.player?.last_name}`}
                  </td>
                  <td className="px-4 py-3">{transfer.from_club?.name || '-'}</td>
                  <td className="px-4 py-3">{transfer.to_club?.name || '-'}</td>
                  <td className="px-4 py-3">{transfer.transfer_date ? formatDate(transfer.transfer_date) : '-'}</td>
                  <td className="px-4 py-3">{transfer.transfer_fee ? `${transfer.transfer_fee} сом` : 'Бесплатно'}</td>
                  <td className="px-4 py-3">
                    <select 
                      value={transfer.status} 
                      onChange={(e) => handleStatusChange(transfer.id, e.target.value)}
                      className={`w-full appearance-none text-center px-2 py-1 rounded text-xs border-0 ${
                        transfer.status === 'confirmed' ? 'bg-green-500/20 text-green-400' : 
                        transfer.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' : 
                        'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {Object.entries(statusMap).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(transfer)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          handleDelete(transfer)
                        }} 
                        className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm"
                        type="button"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/60">
                    {filteredTransfers.length === 0 ? 'Трансферы не найдены' : 'Нет результатов для текущей страницы'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationControls
        page={safeTransferPage}
        pageSize={ITEMS_PER_PAGE}
        totalItems={totalTransfers}
        onPageChange={setCurrentPage}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingTransfer(null)
          setFormData(initialFormData)
          setActiveTransferTab('general')
        }}
        title={editingTransfer ? 'Редактировать трансфер' : 'Добавить трансфер'}
        size="lg"
        className="max-w-4xl"
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              {transferModalTabs.map((tab) => {
                const isActive = activeTransferTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTransferTab(tab.id)}
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
              {activeTransferTab === 'general' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Из клуба *</label>
                      <select
                        value={formData.from_club}
                        onChange={(e) => setFormData({ ...formData, from_club: e.target.value, player: '' })}
                        className="input w-full"
                        required
                      >
                        <option value="">Выберите клуб</option>
                        {clubsList.map((club) => (
                          <option key={club.id} value={club.id.toString()}>
                            {club.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Игрок *</label>
                      <select
                        value={formData.player}
                        onChange={(e) => setFormData({ ...formData, player: e.target.value })}
                        className="input w-full"
                        required
                        disabled={!formData.from_club}
                      >
                        <option value="">{formData.from_club ? 'Выберите игрока' : 'Сначала выберите клуб'}</option>
                        {availablePlayers.map((player) => (
                          <option key={player.id} value={player.id.toString()}>
                            {player.first_name} {player.last_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">В клуб *</label>
                    <select
                      value={formData.to_club}
                      onChange={(e) => setFormData({ ...formData, to_club: e.target.value })}
                      className="input w-full"
                      required
                    >
                      <option value="">Выберите клуб</option>
                      {clubsList
                        .filter((club) => club.id.toString() !== formData.from_club)
                        .map((club) => (
                          <option key={club.id} value={club.id.toString()}>
                            {club.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              )}

              {activeTransferTab === 'details' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Дата трансфера *</label>
                      <input
                        type="date"
                        value={formData.transfer_date}
                        onChange={(e) => setFormData({ ...formData, transfer_date: e.target.value })}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Сумма трансфера (сом)</label>
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={formData.transfer_fee}
                        onChange={(e) => setFormData({ ...formData, transfer_fee: parseFloat(e.target.value) || 0 })}
                        className="input w-full"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Статус *</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="input w-full"
                        required
                      >
                        {Object.entries(statusMap).map(([key, value]) => (
                          <option key={key} value={key}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Сезон</label>
                      <select
                        value={formData.season || ''}
                        onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                        className="input w-full"
                      >
                        <option value="">Все сезоны</option>
                        {seasons?.map((season) => (
                          <option key={season.id} value={season.id}>
                            {season.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTransferTab === 'notes' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Примечания</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="textarea w-full"
                      rows={4}
                      placeholder="Указать детали сделки..."
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
                  setEditingTransfer(null)
                  setFormData(initialFormData)
                  setActiveTransferTab('general')
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
        onClose={() => { setDeleteModalOpen(false); setTransferToDelete(null) }}
        onConfirm={confirmDelete}
        title="Подтверждение удаления"
        message={`Вы действительно хотите удалить трансфер игрока ${transferToDelete?.player?.first_name} ${transferToDelete?.player?.last_name}?`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
        confirmFirst={true}
      />
    </div>
  )
}