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
  
  const [activeSeason, setActiveSeason] = useState<any>(null)
  const [seasonLoading, setSeasonLoading] = useState(true)
  const [seasonError, setSeasonError] = useState<string | null>(null)

  // Получаем выбранный сезон из глобального store
  const { selectedSeasonId } = useSeasonStore()

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

  const fetchTable = useCallback(async (seasonId?: string) => {
    try {
      setTableLoading(true)
      setTableError(null)
      const params: any = { _ts: Date.now() }
      if (seasonId) params.season = seasonId
      
      const result = await apiClient.get<PaginatedResponse<TableRow> | TableRow[]>(API_ENDPOINTS.TABLE, params)
      // Обрабатываем пагинацию
      if (result && typeof result === 'object' && 'results' in result) {
        setTable((result as PaginatedResponse<TableRow>).results)
      } else {
        setTable(result as TableRow[] || [])
      }
    } catch (err) {
      setTableError(err instanceof Error ? err.message : 'Произошла ошибка')
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
        console.log('Обновляем клубы и таблицу...', event.detail.type)
        fetchClubs()
        fetchTable(selectedSeasonId)
      }
    }

    window.addEventListener('data-refresh', handleDataRefresh as EventListener)
    return () => {
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener)
    }
  }, [fetchClubs, fetchTable, selectedSeasonId])

  // Загружаем данные при изменении сезона
  useEffect(() => {
    if (selectedSeasonId) {
      fetchTable(selectedSeasonId)
    }
  }, [selectedSeasonId, fetchTable])

  // Загружаем клубы и активный сезон при монтировании
  useEffect(() => {
    fetchClubs()
    fetchActiveSeason()
  }, [fetchClubs, fetchActiveSeason])


  const refetchClubs = useCallback(() => {
    fetchClubs()
  }, [fetchClubs])

  const refetchTable = () => {
    fetchTable(selectedSeasonId)
  }
  //123
  return {
    clubs: clubs || [],
    clubsLoading,
    clubsError,
    refetchClubs,
    table: table || [],
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