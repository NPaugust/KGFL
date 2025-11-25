"use client"
import React, { useEffect, useMemo, useState } from 'react'
import { useClubs } from '@/hooks/useClubs'
import { HexColorPicker } from 'react-colorful'
import { useApiMutation, useApi } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Club } from '@/types'
import { Loading } from '../Loading'
import { apiClient } from '@/services/api'
import Image from 'next/image'
import { Modal, ConfirmModal } from '../ui/Modal'
import { useSeasonStore } from '@/store/useSeasonStore'
import { Search } from '@/components/Search'
import { PaginationControls, DEFAULT_PAGE_SIZE } from './PaginationControls'

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
  season?: string
  group?: string | null
}

const statusMap = {
  applied: 'Заявлен',
  active: 'Активен',
  disqualified: 'Дисквалифицирован',
  withdrawn: 'Выбыл',
};

const ITEMS_PER_PAGE = DEFAULT_PAGE_SIZE

export function ClubsManager() {
  const { clubs, clubsLoading, refetchClubs } = useClubs()
  const { seasons, selectedSeasonId } = useSeasonStore()
  const [showPrimaryPicker, setShowPrimaryPicker] = useState(false)
  const [showSecondaryPicker, setShowSecondaryPicker] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClub, setEditingClub] = useState<Club | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [clubToDelete, setClubToDelete] = useState<Club | null>(null)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
const [searchTerm, setSearchTerm] = useState('')
const [statusFilter, setStatusFilter] = useState<string | null>(null)
const [filterSeasonId, setFilterSeasonId] = useState<string>('')
const [filterGroupId, setFilterGroupId] = useState<string>('')
const [currentPage, setCurrentPage] = useState(1)
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
    website: '',
    season: '',
    group: null,
    logo: undefined
  })

const filterGroupsUrl = filterSeasonId ? API_ENDPOINTS.SEASON_GROUPS(filterSeasonId) : null
const { data: filterGroupsData } = useApi<any[]>(filterGroupsUrl, undefined, [filterSeasonId])
const filterGroups = useMemo(() => Array.isArray(filterGroupsData) ? filterGroupsData : [], [filterGroupsData])

const resetFilters = () => {
  setSearchTerm('')
  setStatusFilter(null)
  setFilterSeasonId('')
  setFilterGroupId('')
}

useEffect(() => {
  setCurrentPage(1)
}, [searchTerm, statusFilter, filterSeasonId, filterGroupId])
  
  // Загружаем группы для выбранного сезона в форме
  const groupsUrl = formData.season && formData.season.trim() !== '' 
    ? API_ENDPOINTS.SEASON_GROUPS(formData.season)
    : null
  const { data: groupsData } = useApi<any[]>(groupsUrl, undefined, [formData.season])
  const groups = Array.isArray(groupsData) ? groupsData : []

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
      
      // Всегда отправляем season, даже если это пустая строка ("Все сезоны")
      // Это важно для обновления - бэкенд должен знать, что пользователь явно выбрал "Все сезоны"
      const seasonValue = formData.season ? String(formData.season).trim() : ''
      payload.append('season', seasonValue)
      
      // Отправляем группу (даже если null, чтобы бэкенд мог обновить)
      if (formData.season) {
        // Если сезон указан, всегда отправляем группу (даже если пустая строка)
        if (formData.group) {
          payload.append('group', String(formData.group).trim())
        } else {
          // Отправляем пустую строку, чтобы бэкенд установил group в null
          payload.append('group', '')
        }
      }
      
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
      
      // Сбрасываем formData
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
        season: '',
        group: null,
        logo: undefined
      })
      
      refetchClubs()
      
      // Отправляем событие обновления данных
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { type: 'club' } 
      }))
    } catch (error) {
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
      season: '',
      group: null,
      logo: undefined
    })
    setIsModalOpen(true)
  }

  const handleEdit = async (club: Club) => {
    setEditingClub(club)
    
    // Загружаем детальную информацию клуба чтобы получить сезоны
    try {
      const clubDetail = await apiClient.get<Club & { seasons?: any[] }>(API_ENDPOINTS.CLUB_DETAIL(club.id))
      
      // Получаем первый сезон клуба (или самый новый)
      let clubSeasonId = ''
      if (clubDetail.seasons && clubDetail.seasons.length > 0) {
        // Сортируем по дате создания (новые сначала) и берем первый
        const sortedSeasons = [...clubDetail.seasons].sort((a, b) => 
          new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
        )
        const firstSeason = sortedSeasons[0]
        
        // ClubSeasonSerializer возвращает season как объект с id и name
        // Пробуем разные варианты получения season_id
        if (firstSeason.season) {
          if (typeof firstSeason.season === 'object' && firstSeason.season.id) {
            clubSeasonId = firstSeason.season.id.toString()
          } else if (typeof firstSeason.season === 'number' || typeof firstSeason.season === 'string') {
            clubSeasonId = firstSeason.season.toString()
          }
        } else if (firstSeason.season_id) {
          clubSeasonId = firstSeason.season_id.toString()
        } else if (firstSeason.season_name) {
          // Если есть только season_name, ищем сезон по имени
          const seasonByName = seasons.find((s: any) => s.name === firstSeason.season_name)
          if (seasonByName) {
            clubSeasonId = seasonByName.id.toString()
          }
        }
      }
      
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
        season: clubSeasonId,
        group: clubDetail.seasons && clubDetail.seasons.length > 0 
          ? (clubDetail.seasons[0].group?.id?.toString() || clubDetail.seasons[0].group_id?.toString() || null)
          : null,
        logo: undefined, // Файл не префиллим при редактировании
      })
    } catch (error) {
      // Если не удалось загрузить, используем базовые данные
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
        season: '',
        group: null,
        logo: undefined,
      })
    }
    
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

  const clubsList = useMemo(() => Array.isArray(clubs) ? clubs : [], [clubs])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

const filteredClubs = useMemo(() => {
  const normalizedSearch = searchTerm.trim().toLowerCase()
  const seasonNameFilter = filterSeasonId
    ? seasons.find((s) => s.id.toString() === filterSeasonId)?.name || null
    : null
  const groupNameFilter = filterGroupId
    ? filterGroups.find((g: any) => g.id.toString() === filterGroupId)?.name || null
    : null

  return clubsList.filter((club: any) => {
    if (normalizedSearch) {
      const haystack = `${club.name ?? ''} ${(club.short_name ?? '')} ${(club.city ?? '')} ${(club.coach_full_name ?? '')}`.toLowerCase()
      if (!haystack.includes(normalizedSearch)) {
        return false
      }
    }

    if (statusFilter && club.status !== statusFilter) {
      return false
    }

    if (seasonNameFilter) {
      const clubSeasonName = (club as any).season_name || 'Без сезона'
      if (clubSeasonName !== seasonNameFilter) {
        return false
      }
    }

    if (groupNameFilter) {
      const clubGroupName = (club as any).group_name || 'Без группы'
      if (clubGroupName !== groupNameFilter) {
        return false
      }
    }

    return true
  })
}, [clubsList, searchTerm, statusFilter, filterSeasonId, filterGroupId, seasons, filterGroups])

const totalClubs = filteredClubs.length
const totalClubPages = Math.max(1, Math.ceil(totalClubs / ITEMS_PER_PAGE))
const safeClubPage = Math.min(currentPage, totalClubPages)

useEffect(() => {
  if (currentPage !== safeClubPage) {
    setCurrentPage(safeClubPage)
  }
}, [currentPage, safeClubPage])

const paginatedClubs = useMemo(() => {
  const startIndex = (safeClubPage - 1) * ITEMS_PER_PAGE
  return filteredClubs.slice(startIndex, startIndex + ITEMS_PER_PAGE)
}, [filteredClubs, safeClubPage])

const groupedClubs = paginatedClubs.reduce((acc: any, club: any) => {
  const seasonName = (club as any).season_name || 'Без сезона'
  const groupName = (club as any).group_name || 'Без группы'
  const key = `${seasonName}__${groupName}`

  if (!acc[key]) {
    acc[key] = {
      season: seasonName,
      group: groupName,
      clubs: []
    }
  }
  acc[key].clubs.push(club)
  return acc
}, {})

const sortedGroups = Object.values(groupedClubs).sort((a: any, b: any) => {
  if (a.season !== b.season) {
    if (a.season === 'Без сезона') return 1
    if (b.season === 'Без сезона') return -1
    return a.season.localeCompare(b.season)
  }
  if (a.group !== b.group) {
    if (a.group === 'Без группы') return 1
    if (b.group === 'Без группы') return -1
    return a.group.localeCompare(b.group)
  }
  return 0
})

const sortedClubsByGroup = sortedGroups.map((group: any) => ({
  ...group,
  clubs: [...group.clubs].sort((a: any, b: any) => {
    if (!sortField) return 0

    let aValue: any = a[sortField as keyof typeof a]
    let bValue: any = b[sortField as keyof typeof b]

    if (sortField === 'season_name') {
      aValue = (a as any).season_name || ''
      bValue = (b as any).season_name || ''
    }

    if (sortField === 'founded') {
      aValue = aValue || 0
      bValue = bValue || 0
    }

    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = (bValue || '').toLowerCase()
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })
}))

const statusEntries = Object.entries(statusMap)

const clubModalTabs: { id: 'general' | 'branding' | 'staff' | 'participation'; label: string; description: string }[] = [
  { id: 'general', label: 'Общая информация', description: 'Основные данные клуба' },
  { id: 'branding', label: 'Брендинг', description: 'Цвета, логотип' },
  { id: 'staff', label: 'Персонал', description: 'Тренеры, ассистенты, капитан' },
  { id: 'participation', label: 'Участие', description: 'Взнос, статус, сезон' },
]

const [activeClubTab, setActiveClubTab] = useState<'general' | 'branding' | 'staff' | 'participation'>('general')

return (
  <div className="p-6">
    <div className="mb-6 flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold">Управление клубами</h1>
        <button onClick={handleCreateClick} className="btn btn-primary whitespace-nowrap">Добавить клуб</button>
      </div>

      <div className="card bg-white/5 border border-white/10 p-4 rounded-none">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1 min-w-[220px]">
            <Search
              placeholder="Поиск по названию, городу или тренеру"
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
              onChange={(e) => {
                setFilterSeasonId(e.target.value)
                setFilterGroupId('')
              }}
              className="input min-w-[160px] !rounded-none appearance-none h-10"
            >
              <option value="">Все сезоны</option>
              {seasons.map((season) => (
                <option key={season.id} value={season.id}>{season.name}</option>
              ))}
            </select>

            {filterSeasonId && filterGroups.length > 0 && (
              <select
                value={filterGroupId}
                onChange={(e) => setFilterGroupId(e.target.value)}
                className="input min-w-[140px] !rounded-none appearance-none h-10"
              >
                <option value="">Все группы</option>
                {filterGroups.map((group: any) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            )}

            <button
              onClick={resetFilters}
              className="btn btn-outline whitespace-nowrap !rounded-none h-10 px-4"
              disabled={
                !searchTerm && !statusFilter && !filterSeasonId && !filterGroupId
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

      <PaginationControls
        page={safeClubPage}
        pageSize={ITEMS_PER_PAGE}
        totalItems={totalClubs}
        onPageChange={setCurrentPage}
      />
    </div>

    <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Логотип</th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('name')}
                >
                  Название {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('city')}
                >
                  Город {sortField === 'city' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('founded')}
                >
                  Основан {sortField === 'founded' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('coach_full_name')}
                >
                  Тренер {sortField === 'coach_full_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left">Телефон</th>
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
              {sortedClubsByGroup.length > 0 ? sortedClubsByGroup.map((group: any, groupIdx: number) => (
                <React.Fragment key={`group-${groupIdx}`}>
                  {/* Заголовок группы/сезона */}
                  {(group.season !== 'Без сезона' || group.group !== 'Без группы') && (
                    <tr className="bg-white/10 border-b-2 border-white/20">
                      <td colSpan={9} className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {group.season !== 'Без сезона' && (
                            <span className="px-2 py-1 bg-brand-primary/20 text-brand-primary rounded text-sm font-medium">
                              {group.season}
                            </span>
                          )}
                          {group.group !== 'Без группы' && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm font-medium">
                              {group.group}
                            </span>
                          )}
                          <span className="text-white/60 text-sm">
                            ({group.clubs.length} {group.clubs.length === 1 ? 'клуб' : group.clubs.length < 5 ? 'клуба' : 'клубов'})
                          </span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {/* Клубы в группе */}
                  {group.clubs.map((club: any) => (
                    <tr key={club.id} className="border-b border-white/10 hover:bg-white/5">
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
                      <td className="px-4 py-3">
                        {(club as any).season_name ? (
                          <span className="px-2 py-1 bg-brand-primary/20 text-brand-primary rounded text-sm">
                            {(club as any).season_name}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="px-4 py-3">{statusMap[club.status as keyof typeof statusMap] || club.status}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button onClick={() => handleEdit(club)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                          <button onClick={() => handleDelete(club)} className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm">Удалить</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              )) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-white/60">
                    {filteredClubs.length === 0 ? 'Клубы не найдены' : 'Нет результатов для текущей страницы'}
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
          setIsModalOpen(false); 
          setEditingClub(null); 
          setActiveClubTab('general')
          setShowPrimaryPicker(false)
          setShowSecondaryPicker(false)
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
            season: '',
            group: null,
            logo: undefined
          });
        }}
        title={editingClub ? 'Редактировать клуб' : 'Добавить клуб'}
        size="2xl"
        className="max-w-6xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            {clubModalTabs.map((tab) => {
              const isActive = activeClubTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveClubTab(tab.id)
                    setShowPrimaryPicker(false)
                    setShowSecondaryPicker(false)
                  }}
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
            {activeClubTab === 'general' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Название *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input w-full"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Город / регион</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Год основания</label>
                    <input
                      type="number"
                      value={formData.founded || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          founded: e.target.value ? parseInt(e.target.value, 10) || undefined : undefined,
                        })
                      }
                      className="input w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Веб‑сайт</label>
                    <input
                      type="url"
                      value={formData.website || ''}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="input w-full"
                      placeholder="https://club.kg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Описание клуба</label>
                  <textarea
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="textarea w-full"
                    rows={4}
                    placeholder="Достижения, история, ключевые факты..."
                  />
                </div>
              </div>
            )}

            {activeClubTab === 'branding' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Цвет формы (основная)</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowPrimaryPicker(!showPrimaryPicker)}
                      className="inline-block h-8 w-12 rounded-md border border-white/20"
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
                  {showPrimaryPicker && (
                    <div className="absolute z-50 mt-3 p-3 rounded-xl border border-white/10 bg-gray-900 shadow-xl">
                      <HexColorPicker
                        color={formData.primary_kit_color || '#FFFFFF'}
                        onChange={(hex) => setFormData({ ...formData, primary_kit_color: hex })}
                      />
                    </div>
                  )}
                </div>

                <div className="relative">
                  <label className="block text-sm font-medium mb-1">Цвет формы (запасная)</label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setShowSecondaryPicker(!showSecondaryPicker)}
                      className="inline-block h-8 w-12 rounded-md border border-white/20"
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
                  {showSecondaryPicker && (
                    <div className="absolute z-50 mt-3 p-3 rounded-xl border border-white/10 bg-gray-900 shadow-xl">
                      <HexColorPicker
                        color={formData.secondary_kit_color || '#000000'}
                        onChange={(hex) => setFormData({ ...formData, secondary_kit_color: hex })}
                      />
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1">Логотип</label>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml,image/webp"
                    onChange={(e) => setFormData({ ...formData, logo: e.target.files?.[0] })}
                    className="input w-full"
                  />
                  <p className="text-xs text-white/50 mt-1">Поддерживаются PNG, JPG, SVG, WEBP до 5 МБ</p>
                </div>
              </div>
            )}

            {activeClubTab === 'staff' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Тренер (ФИО)</label>
                    <input
                      type="text"
                      value={formData.coach_full_name}
                      onChange={(e) => setFormData({ ...formData, coach_full_name: e.target.value })}
                      className="input w-full"
                      placeholder="Не указан"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Ассистент / Менеджер</label>
                    <input
                      type="text"
                      value={formData.assistant_full_name}
                      onChange={(e) => setFormData({ ...formData, assistant_full_name: e.target.value })}
                      className="input w-full"
                      placeholder="Не указан"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Капитан</label>
                    <input
                      type="text"
                      value={formData.captain_full_name || ''}
                      onChange={(e) => setFormData({ ...formData, captain_full_name: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Телефон</label>
                    <input
                      type="tel"
                      pattern="^[+\\d][\\d\\s()-]{6,}$"
                      title="Например: +996 700 123 456"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="input w-full"
                      placeholder="+996 700 123 456"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.contact_email || ''}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="input w-full"
                      placeholder="club@domain.kg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Соцсети (URL)</label>
                    <input
                      type="url"
                      pattern="https?://.+"
                      title="Полный URL, например: https://www.instagram.com/kgfleague"
                      value={formData.social_media || ''}
                      onChange={(e) => setFormData({ ...formData, social_media: e.target.value })}
                      className="input w-full"
                      placeholder="https://www.instagram.com/kgfleague"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeClubTab === 'participation' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1">Взнос на участие *</label>
                    <select
                      value={formData.participation_fee}
                      onChange={(e) => setFormData({ ...formData, participation_fee: e.target.value as any })}
                      className="input w-full"
                      required
                    >
                      <option value="yes">Есть</option>
                      <option value="no">Нет</option>
                      <option value="partial">Частично</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Статус команды</label>
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
                  <div>
                    <label className="block text-sm font-medium mb-1">Сезон добавления</label>
                    <select
                      value={formData.season || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, season: e.target.value, group: null })
                      }}
                      className="input w-full"
                    >
                      <option value="">Все сезоны</option>
                      {seasons.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {formData.season && groups.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Группа</label>
                      <select
                        value={formData.group || ''}
                        onChange={(e) => setFormData({ ...formData, group: e.target.value || null })}
                        className="input w-full"
                      >
                        <option value="">Без группы</option>
                        {groups.map((g: any) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-white/60 mt-1">Выберите группу, если сезон имеет групповой этап</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:gap-4 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false)
                setEditingClub(null)
                setActiveClubTab('general')
                setShowPrimaryPicker(false)
                setShowSecondaryPicker(false)
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
                  season: '',
                  group: null,
                  logo: undefined,
                })
              }}
              className="btn btn-outline flex-1"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={createClubMutation.loading || updateClubMutation.loading}
            >
              {createClubMutation.loading || updateClubMutation.loading ? 'Сохранение...' : 'Сохранить'}
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