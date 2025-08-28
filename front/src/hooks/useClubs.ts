"use client"
import { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'
import { API_ENDPOINTS } from '@/services/api'
import { Club, TableRow } from '@/types'
import { useApi } from './useApi'

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

  const fetchClubs = async () => {
    try {
      setClubsLoading(true)
      setClubsError(null)
      const result = await apiClient.get<any>(API_ENDPOINTS.CLUBS)
      // Обрабатываем пагинацию
      const clubsData = result.results || result || []
      setClubs(clubsData)
    } catch (err) {
      setClubsError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setClubsLoading(false)
    }
  }

  const fetchTable = async () => {
    try {
      setTableLoading(true)
      setTableError(null)
      const result = await apiClient.get<any>(API_ENDPOINTS.TABLE)
      // Обрабатываем пагинацию
      const tableData = result.results || result || []
      setTable(tableData)
    } catch (err) {
      setTableError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setTableLoading(false)
    }
  }

  const fetchActiveSeason = async () => {
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
  }

  useEffect(() => {
    fetchClubs()
    fetchTable()
    fetchActiveSeason()
  }, [refreshKey])

  const refetchClubs = () => {
    setRefreshKey(prev => prev + 1)
  }

  const refetchTable = () => {
    setRefreshKey(prev => prev + 1)
  }

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