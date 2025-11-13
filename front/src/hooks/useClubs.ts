"use client"
import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/services/api'
import { API_ENDPOINTS } from '@/services/api'
import { Club, TableRow, PaginatedResponse } from '@/types'
import { useApi } from './useApi'
import { useSeasonStore } from '@/store/useSeasonStore'

export function useClubs() {
  const [clubs, setClubs] = useState<Club[]>([])
  const [clubsLoading, setClubsLoading] = useState(true)
  const [clubsError, setClubsError] = useState<string | null>(null)
  
  const [table, setTable] = useState<TableRow[]>([])
  const [tableLoading, setTableLoading] = useState(true)
  const [tableError, setTableError] = useState<string | null>(null)
  
  const [groupsData, setGroupsData] = useState<{ season: any; groups: Array<{ group: any; teams: TableRow[] }> } | null>(null)
  
  const [activeSeason, setActiveSeason] = useState<any>(null)
  const [seasonLoading, setSeasonLoading] = useState(true)
  const [seasonError, setSeasonError] = useState<string | null>(null)

  // Получаем выбранный сезон и группу из глобального store
  const { selectedSeasonId, selectedGroupId } = useSeasonStore()

  const fetchClubs = useCallback(async () => {
    try {
      setClubsLoading(true)
      setClubsError(null)
      const result = await apiClient.get<PaginatedResponse<Club> | Club[]>(API_ENDPOINTS.CLUBS, { all: 1, _ts: Date.now() })
      // Обрабатываем пагинацию
      if (result && typeof result === 'object' && 'results' in result) {
        setClubs((result as PaginatedResponse<Club>).results)
      } else {
        setClubs(result as Club[] || [])
      }
    } catch (err) {
      setClubsError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setClubsLoading(false)
    }
  }, [])

  const fetchTable = useCallback(async (seasonId?: string, groupId?: string | null) => {
    try {
      setTableLoading(true)
      setTableError(null)
      const params: any = { _ts: Date.now() }
      // Передаем season только если он указан и не пустой
      if (seasonId && seasonId.trim() !== '') {
        params.season = seasonId
      }
      // Передаем group только если он указан
      if (groupId && (typeof groupId === 'string' ? groupId.trim() !== '' : groupId !== null && groupId !== undefined)) {
        params.group = typeof groupId === 'string' ? groupId : String(groupId)
      }
      // Если seasonId пустой или undefined - не передаем параметр, бэкенд вернет агрегированные данные
      
      const result = await apiClient.get<any>(API_ENDPOINTS.TABLE, params)
      
      // Проверяем, является ли результат объектом с группами (для сезонов с групповым этапом)
      if (result && typeof result === 'object' && 'groups' in result && Array.isArray(result.groups)) {
        // Это сезон с группами без указания конкретной группы - сохраняем структуру групп
        setGroupsData({
          season: result.season || null,
          groups: result.groups || []
        })
        setTable([]) // Очищаем обычную таблицу
      } else if (result && typeof result === 'object' && 'results' in result) {
        // Пагинация
        setGroupsData(null) // Очищаем данные групп
        setTable((result as PaginatedResponse<TableRow>).results)
      } else if (Array.isArray(result)) {
        // Обычный массив команд
        setGroupsData(null) // Очищаем данные групп
        setTable(result)
      } else {
        // Неожиданный формат - устанавливаем пустой массив
        setGroupsData(null)
        setTable([])
      }
    } catch (err) {
      setTableError(err instanceof Error ? err.message : 'Произошла ошибка')
      setTable([]) // Устанавливаем пустой массив при ошибке
    } finally {
      setTableLoading(false)
    }
  }, [])

  const fetchActiveSeason = useCallback(async () => {
    try {
      setSeasonLoading(true)
      setSeasonError(null)
      const result = await apiClient.get<any>(API_ENDPOINTS.SEASONS)
      const seasons = Array.isArray(result) ? result : (result?.results || [])
      const active = seasons.find((s: any) => s.is_active) || seasons[0]
      setActiveSeason(active)
    } catch (err) {
      setSeasonError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setSeasonLoading(false)
    }
  }, [])

  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      const refreshTypes = ['match', 'club', 'player', 'player_stats', 'transfer', 'season']
      if (refreshTypes.includes(event.detail.type)) {
        fetchClubs()
        // Если selectedSeasonId пустой или null - передаем undefined для "Все сезоны"
        fetchTable(selectedSeasonId && selectedSeasonId.trim() !== '' ? selectedSeasonId : undefined, selectedGroupId)
      }
    }

    window.addEventListener('data-refresh', handleDataRefresh as EventListener)
    return () => {
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener)
    }
  }, [fetchClubs, fetchTable, selectedSeasonId, selectedGroupId])

  // Загружаем данные при изменении сезона или группы
  useEffect(() => {
    // Если selectedSeasonId пустой или null - передаем undefined для "Все сезоны"
    fetchTable(selectedSeasonId && selectedSeasonId.trim() !== '' ? selectedSeasonId : undefined, selectedGroupId)
  }, [selectedSeasonId, selectedGroupId, fetchTable])

  // Загружаем клубы и активный сезон при монтировании  
  useEffect(() => {
    fetchClubs()
    fetchActiveSeason()
    // Если selectedSeasonId пустой или null - передаем undefined для "Все сезоны"
    fetchTable(selectedSeasonId && selectedSeasonId.trim() !== '' ? selectedSeasonId : undefined, selectedGroupId)
  }, [fetchClubs, fetchActiveSeason, fetchTable, selectedSeasonId, selectedGroupId])


  const refetchClubs = useCallback(() => {
    fetchClubs()
  }, [fetchClubs])

  const refetchTable = () => {
    fetchTable(selectedSeasonId && selectedSeasonId.trim() !== '' ? selectedSeasonId : undefined, selectedGroupId)
  }
  //123
  return {
    clubs: clubs || [],
    clubsLoading,
    clubsError,
    refetchClubs,
    table: table || [],
    groupsData, // Добавляем данные групп
    tableLoading,
    tableError,
    refetchTable,
    activeSeason,
    seasonLoading,
    seasonError,
  }
}

export function useClub(id: string) {
  const { data: club, loading, error, refetch } = useApi<Club>(API_ENDPOINTS.CLUB_DETAIL(id))
  
  return {
    club,
    loading,
    error,
    refetch,
  }
}

export function useClubPlayers(clubId: string) {
  const { data: players, loading, error, refetch } = useApi<any[]>(API_ENDPOINTS.CLUB_PLAYERS(clubId))
  
  return {
    players: players || [],
    loading,
    error,
    refetch,
  }
}