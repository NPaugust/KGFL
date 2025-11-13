"use client"
import { useMemo, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Player, Club, PlayerTransfer } from '@/types'
import { Loading } from '@/components/Loading'
import { useSeasonStore } from '@/store/useSeasonStore'
import Image from 'next/image'
import { getImageUrl } from '@/utils'
import { Modal, ConfirmModal } from '../ui/Modal'
import { Search } from '@/components/Search'

interface PlayerFormData {
  first_name: string
  last_name: string
  position: string
  nationality: string
  club: string
  date_of_birth: string
  photo?: File
  number?: number
  height?: number
  weight?: number
  phone?: string
  notes?: string
  status?: 'applied' | 'active' | 'injured' | 'disqualified' | 'loan' | 'withdrawn'
  season?: string
}

const positionMap = {
  GK: 'Вратарь',
  DF: 'Защитник',
  MF: 'Полузащитник',
  FW: 'Нападающий',
};

const statusMap = {
  applied: 'Заявлен',
  active: 'Активен',
  injured: 'Травма',
  disqualified: 'Дисквалификация',
  loan: 'Аренда',
  withdrawn: 'Выбыл',
};

export function PlayersManager() {
  const { data: players, loading, error, refetch } = useApi<Player[]>(API_ENDPOINTS.PLAYERS)
  const { data: clubs, loading: clubsLoading } = useApi<Club[]>(`${API_ENDPOINTS.CLUBS}?all=1`)
  const { data: transfers, refetch: refetchTransfers } = useApi<PlayerTransfer[]>(API_ENDPOINTS.PLAYER_TRANSFERS)
  const { seasons, selectedSeasonId } = useSeasonStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [playerToDelete, setPlayerToDelete] = useState<Player | null>(null)
  const [filterSeasonId, setFilterSeasonId] = useState<string>('')
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [positionFilter, setPositionFilter] = useState<string>('')
  const [clubFilter, setClubFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [formData, setFormData] = useState<PlayerFormData>({
    first_name: '',
    last_name: '',
    position: 'GK',
    nationality: '',
    club: '',
    date_of_birth: '',
    number: undefined,
    height: undefined,
    weight: undefined,
    phone: '',
    notes: '',
    status: 'applied',
    season: ''
  })
  const [activePlayerTab, setActivePlayerTab] = useState<'personal' | 'club' | 'details' | 'media'>('personal')

  const { mutate, loading: mutationLoading, error: mutationError } = useApiMutation<Player>()

  const resetFilters = () => {
    setSearchTerm('')
    setPositionFilter('')
    setClubFilter('')
    setStatusFilter(null)
    setFilterSeasonId('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const formDataToSend = new FormData()
      formDataToSend.append('first_name', formData.first_name)
      formDataToSend.append('last_name', formData.last_name)
      formDataToSend.append('position', formData.position)
      formDataToSend.append('nationality', formData.nationality || '')
      // Для пустого клуба отправляем пустую строку, бэкенд конвертирует в null
      formDataToSend.append('club', formData.club || '')
      formDataToSend.append('date_of_birth', formData.date_of_birth)
      
      // Фото необязательно - добавляем только если выбрано
      if (formData.photo) {
        formDataToSend.append('photo', formData.photo)
      }
      
      // Номер обязателен
      if (!formData.number) {
        alert('Номер игрока обязателен')
        return
      }
      
      formDataToSend.append('number', String(formData.number))
      formDataToSend.append('height', formData.height ? String(formData.height) : '')
      formDataToSend.append('weight', formData.weight ? String(formData.weight) : '')
      formDataToSend.append('phone', formData.phone || '')
      formDataToSend.append('notes', formData.notes || '')
      formDataToSend.append('status', formData.status || 'applied')
      formDataToSend.append('season', formData.season || '')

      if (editingPlayer) {
        await mutate(API_ENDPOINTS.PLAYER_DETAIL(editingPlayer.id.toString()), 'PATCH', formDataToSend)
      } else {
        await mutate(API_ENDPOINTS.PLAYERS, 'POST', formDataToSend)
      }

      setIsModalOpen(false)
      setEditingPlayer(null)
      
      // Сбрасываем formData только при создании нового игрока
      if (!editingPlayer) {
        setFormData({ 
          first_name: '', last_name: '', position: 'GK', nationality: '', 
          club: '', date_of_birth: '', number: undefined, height: undefined, 
          weight: undefined, phone: '', notes: '', status: 'applied',
          season: ''
        })
      }
      refetch()
      
      // Принудительно обновляем связанные данные
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('data-refresh', { 
          detail: { 
            type: 'player', 
            id: editingPlayer?.id || 'new',
            action: editingPlayer ? 'updated' : 'created'
          } 
        }))
        // Дополнительное обновление для статистики
        window.dispatchEvent(new CustomEvent('data-refresh', { 
          detail: { type: 'player_stats' } 
        }))
      }, 100)
    } catch (error: any) {
      const backend = error?.response?.data
      const msg = typeof backend === 'string' ? backend : JSON.stringify(backend)
      alert(`Ошибка при сохранении игрока: ${error?.message || ''}\n${msg || ''}`)
    }
  }

  const handleCreateClick = () => {
    setEditingPlayer(null)
    // Принудительно сбрасываем все данные формы
    setFormData({
      first_name: '',
      last_name: '',
      position: 'GK',
      nationality: '',
      club: '',
      date_of_birth: '',
      number: undefined,
      height: undefined,
      weight: undefined,
      phone: '',
      notes: '',
      status: 'applied',
      season: '',
      photo: undefined
    })
    setActivePlayerTab('personal')
    setIsModalOpen(true)
  }

  const handleEdit = (player: Player) => {
    setEditingPlayer(player)
    setFormData({
      first_name: player.first_name || '',
      last_name: player.last_name || '',
      position: player.position || 'GK',
      nationality: player.nationality || '',
      // Поддержка варианта, когда в player.club приходит объект или только id
      club: player.club ? (typeof player.club === 'object' ? (player.club.id?.toString() || '') : String(player.club)) : '',
      date_of_birth: player.date_of_birth ? new Date(player.date_of_birth).toISOString().split('T')[0] : '',
      number: player.number,
      height: player.height,
      weight: player.weight,
      phone: player.phone || '',
      notes: player.notes || '',
      status: player.status || 'applied',
      season: (player as any).season?.toString() || '',
      photo: undefined, // Файл не префиллим при редактировании
    })
    setActivePlayerTab('personal')
    setIsModalOpen(true)
  }

  const handleDelete = (player: Player) => {
    setPlayerToDelete(player)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!playerToDelete) return
    
    try {
      await mutate(API_ENDPOINTS.PLAYER_DETAIL(playerToDelete.id), 'DELETE')
      refetch()
      setDeleteModalOpen(false)
      setPlayerToDelete(null)
    } catch (error: any) {
      alert(`Ошибка при удалении игрока: ${error?.response?.data?.detail || error?.message || 'Неизвестная ошибка'}`)
    }
  }

  const playersList = useMemo(() => Array.isArray(players) ? players : [], [players])
  const clubsList = useMemo(() => Array.isArray(clubs) ? clubs : [], [clubs])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredPlayers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return playersList.filter((player: any) => {
      if (filterSeasonId) {
        const playerSeasonId =
          player.season?.toString() ??
          (player as any).season_id?.toString() ??
          null
        if (playerSeasonId !== filterSeasonId) {
          return false
        }
      }

      if (normalizedSearch) {
        const haystack = `${player.first_name ?? ''} ${player.last_name ?? ''} ${(player as any).club_name ?? ''}`.toLowerCase()
        if (!haystack.includes(normalizedSearch)) {
          return false
        }
      }

      if (positionFilter && player.position !== positionFilter) {
        return false
      }

      if (statusFilter && player.status !== statusFilter) {
        return false
      }

      if (clubFilter) {
        const playerClubId =
          (typeof player.club === 'object' && player.club !== null
            ? player.club.id
            : player.club)?.toString() ??
          (player as any).club_id?.toString() ??
          null

        if (playerClubId !== clubFilter) {
          return false
        }
      }

      return true
    })
  }, [playersList, filterSeasonId, searchTerm, positionFilter, statusFilter, clubFilter])

  const sortedPlayers = useMemo(() => {
    const playersToSort = [...filteredPlayers]

    return playersToSort.sort((a: any, b: any) => {
    if (!sortField) return 0
    
    let aValue: any = a[sortField as keyof typeof a]
    let bValue: any = b[sortField as keyof typeof b]
    
    // Специальная обработка для разных полей
    if (sortField === 'first_name' || sortField === 'last_name') {
      aValue = (aValue || '').toLowerCase()
      bValue = (bValue || '').toLowerCase()
    } else if (sortField === 'club_name') {
      aValue = ((a as any).club_name || (a.club as any)?.name || '').toLowerCase()
      bValue = ((b as any).club_name || (b.club as any)?.name || '').toLowerCase()
    } else if (sortField === 'season_name') {
      aValue = ((a as any).season_name || '').toLowerCase()
      bValue = ((b as any).season_name || '').toLowerCase()
    } else if (sortField === 'number') {
      aValue = aValue || 0
      bValue = bValue || 0
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })
  }, [filteredPlayers, sortField, sortDirection])

  if (loading || clubsLoading) {
    return <Loading />
  }

  const statusEntries = Object.entries(statusMap)
  const playerModalTabs: { id: 'personal' | 'club' | 'details' | 'media'; label: string; description: string }[] = [
    { id: 'personal', label: 'Личные данные', description: 'Имя, фамилия, дата рождения' },
    { id: 'club', label: 'Клуб и статус', description: 'Позиция, клуб, сезон, номер' },
    { id: 'details', label: 'Дополнительно', description: 'Рост, вес, контакты, заметки' },
    { id: 'media', label: 'Медиа', description: 'Фото игрока' }
  ]

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Управление игроками</h1>
          <button onClick={handleCreateClick} className="btn btn-primary whitespace-nowrap">Добавить игрока</button>
        </div>

        <div className="card bg-white/5 border border-white/10 p-4 rounded-none">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search
                placeholder="Поиск по имени или клубу"
                onSearch={setSearchTerm}
                className="w-full"
                hideIcon
                square
                initialValue={searchTerm}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select 
                value={filterSeasonId} 
                onChange={(e) => setFilterSeasonId(e.target.value)}
                className="input min-w-[150px] !rounded-none appearance-none h-10"
              >
                <option value="">Все сезоны</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="input min-w-[140px] !rounded-none appearance-none h-10"
              >
                <option value="">Все позиции</option>
                {Object.entries(positionMap).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              <select
                value={clubFilter}
                onChange={(e) => setClubFilter(e.target.value)}
                className="input min-w-[160px] !rounded-none appearance-none h-10"
              >
                <option value="">Все клубы</option>
                {clubsList.map((club) => (
                  <option key={club.id} value={club.id.toString()}>{club.name}</option>
                ))}
              </select>

              <button
                onClick={resetFilters}
                className="btn btn-outline whitespace-nowrap !rounded-none h-10 px-4"
                disabled={
                  !searchTerm && !positionFilter && !clubFilter && !statusFilter && !filterSeasonId
                }
              >
                Сбросить
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {statusEntries.map(([key, label]) => {
              const isActive = statusFilter === key
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(isActive ? null : key)}
                  className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                    isActive
                      ? 'border-brand-primary bg-brand-primary/20 text-brand-primary'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Фото</th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('first_name')}
                >
                  Имя {sortField === 'first_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('position')}
                >
                  Позиция {sortField === 'position' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('club_name')}
                >
                  Клуб {sortField === 'club_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('season_name')}
                >
                  Сезон {sortField === 'season_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('status')}
                >
                  Статус {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.length > 0 ? (
                sortedPlayers.map((player) => (
                      <tr key={player.id} className="border-b border-white/10">
                        <td className="px-4 py-3">
                          {((player as any).photo_url || player.photo) ? (
                            <Image 
                              src={(player as any).photo_url || getImageUrl(player.photo || '')} 
                              alt={player.first_name} 
                              width={48} 
                              height={48} 
                              className="w-12 h-12 rounded object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-white/5 rounded flex items-center justify-center border border-white/10">
                              <Image
                                src="/images/player-silhouette.svg"
                                alt="Player silhouette"
                                width={32}
                                height={32}
                                className="opacity-40"
                              />
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{player.first_name} {player.last_name}</td>
                        <td className="px-4 py-3">{positionMap[player.position as keyof typeof positionMap] || player.position}</td>
                        <td className="px-4 py-3">{(player as any).club_name || (player.club as any)?.name || player.club || '-'}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-brand-primary/20 text-brand-primary rounded text-sm">
                            {(player as any).season_name || ((player as any).season?.name) || 'Без сезона'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            player.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {statusMap[player.status as keyof typeof statusMap] || player.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button onClick={() => handleEdit(player)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                            <button onClick={() => handleDelete(player)} className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm">Удалить</button>
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-white/60">Игроки не найдены</td>
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
          setEditingPlayer(null)
          setActivePlayerTab('personal')
        }}
        title={editingPlayer ? 'Редактировать игрока' : 'Добавить игрока'}
        size="2xl"
        className="max-w-5xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            {playerModalTabs.map((tab) => {
              const isActive = activePlayerTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePlayerTab(tab.id)}
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
            {activePlayerTab === 'personal' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Имя *</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      className="input w-full"
                      placeholder="Введите имя"
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
                      placeholder="Введите фамилию"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Национальность</label>
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                      className="input w-full"
                      placeholder="Кыргызстан"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Дата рождения *</label>
                    <input
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {activePlayerTab === 'club' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Позиция *</label>
                    <select
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      className="input w-full"
                      required
                    >
                      <option value="">Выберите позицию</option>
                      {Object.entries(positionMap).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Клуб</label>
                    <select
                      value={formData.club}
                      onChange={(e) => setFormData({ ...formData, club: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">Выберите клуб</option>
                      {clubsList.map((club) => (
                        <option key={club.id} value={club.id.toString()}>
                          {club.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Номер *</label>
                    <input
                      type="number"
                      min={1}
                      max={99}
                      value={formData.number || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          number: e.target.value ? parseInt(e.target.value, 10) || undefined : undefined,
                        })
                      }
                      className="input w-full"
                      placeholder="1-99"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Сезон</label>
                    <select
                      value={formData.season || ''}
                      onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                      className="input w-full"
                    >
                      <option value="">Все сезоны</option>
                      {seasons.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Статус игрока</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="input w-full"
                    >
                      {Object.entries(statusMap).map(([key, value]) => (
                        <option key={key} value={key}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {activePlayerTab === 'details' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Рост (см)</label>
                    <input
                      type="number"
                      min={100}
                      max={250}
                      value={formData.height || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          height: e.target.value ? parseInt(e.target.value, 10) || undefined : undefined,
                        })
                      }
                      className="input w-full"
                      placeholder="170"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Вес (кг)</label>
                    <input
                      type="number"
                      min={40}
                      max={150}
                      value={formData.weight || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          weight: e.target.value ? parseInt(e.target.value, 10) || undefined : undefined,
                        })
                      }
                      className="input w-full"
                      placeholder="70"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Телефон</label>
                    <input
                      type="tel"
                      pattern="^[+\\d][\\d\\s()-]{6,}$"
                      title="Например: +996 700 123 456"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="input w-full"
                      placeholder="+996 700 123 456"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Примечание</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="textarea w-full"
                    rows={4}
                    placeholder="Особые условия, травмы, аренда..."
                  />
                </div>
              </div>
            )}

            {activePlayerTab === 'media' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Фото игрока (необязательно)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData({ ...formData, photo: e.target.files?.[0] })}
                    className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30"
                  />
                  {!formData.photo && (
                    <div className="text-xs text-white/60 mt-2">
                      Если фото не загружено, будет использован силуэт игрока
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:gap-4 pt-4 border-t border-white/10">
            <button
              type="submit"
              className="flex-1 btn btn-primary h-12"
              disabled={mutationLoading}
            >
              {mutationLoading ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingPlayer(null)
                setActivePlayerTab('personal')
              }}
              className="flex-1 btn btn-outline h-12"
            >
              Отмена
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setPlayerToDelete(null) }}
        onConfirm={confirmDelete}
        title="Подтверждение удаления"
        message={`Вы действительно хотите удалить игрока ${playerToDelete?.first_name} ${playerToDelete?.last_name}?`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
        confirmFirst={true}
      />
    </div>
  )
} 