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
  const [refreshKey, setRefreshKey] = useState(0)
  
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
      
      // Используем переданный seasonId или выбранный из store
      const currentSeasonId = seasonId || selectedSeasonId
      
      if (!currentSeasonId) {
        setTable([])
        return
      }
      
      // Добавляем параметр season в URL
      const url = `${API_ENDPOINTS.TABLE}?season=${currentSeasonId}`
      const result = await apiClient.get<TableRow[]>(url)
      setTable(result || [])
    } catch (err) {
      setTableError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setTableLoading(false)
    }
  }, [selectedSeasonId])

  const fetchActiveSeason = useCallback(async () => {
    try {
      setSeasonLoading(true)
      setSeasonError(null)
      const result = await apiClient.get<any>(API_ENDPOINTS.ACTIVE_SEASON)
      setActiveSeason(result)
    } catch (err) {
      setSeasonError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setSeasonLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchClubs()
    fetchActiveSeason()
  }, [fetchClubs, fetchActiveSeason, refreshKey])

  // Обновляем таблицу при изменении выбранного сезона
  useEffect(() => {
    if (selectedSeasonId) {
      fetchTable(selectedSeasonId)
    }
  }, [selectedSeasonId, fetchTable])

  // Убираем слушатель season-changed чтобы избежать бесконечных циклов

  const refetchClubs = useCallback(() => {
    // Мгновенно перечитываем список клубов
    fetchClubs()
    // и дергаем refreshKey на случай внешних зависимостей
    setRefreshKey(prev => prev + 1)
  }, [fetchClubs])

  const refetchTable = useCallback(() => {
    if (selectedSeasonId) {
      fetchTable(selectedSeasonId)
    }
  }, [selectedSeasonId, fetchTable])

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
    club: club || null,
    loading,
    error,
    refetch,
  }
} 