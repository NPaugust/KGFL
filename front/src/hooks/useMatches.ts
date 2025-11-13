"use client"
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Match } from '@/types'
import { useEffect, useMemo } from 'react'
import { useSeasonStore } from '@/store/useSeasonStore'

export function useMatches() {
  const { selectedSeasonId } = useSeasonStore()
  
  // Формируем URL с параметрами
  const url = useMemo(() => {
    const params: any = { _ts: Date.now() }
    if (selectedSeasonId && selectedSeasonId.trim() !== '') {
      params.season = selectedSeasonId
    }
    const queryString = new URLSearchParams(params).toString()
    return `${API_ENDPOINTS.MATCHES}?${queryString}`
  }, [selectedSeasonId])
  
  const { data: matches, loading, error, refetch } = useApi<any>(url)
  
  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      const refreshTypes = ['match', 'club', 'stadium', 'season', 'player', 'player_stats']
      if (refreshTypes.includes(event.detail.type)) {
        refetch()
      }
    }

    window.addEventListener('data-refresh', handleDataRefresh as EventListener)
    return () => {
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener)
    }
  }, [refetch])
  
  // Обрабатываем пагинацию
  const matchesData = matches?.results || matches || []

  return {
    matches: matchesData,
    loading,
    error,
    refetch,
  }
}

export function useUpcomingMatches() {
  const { data, loading, error, refetch } = useApi<any>(API_ENDPOINTS.UPCOMING_MATCHES)
  const matches = (data && 'results' in (data as any)) ? (data as any).results : (data || [])
  
  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      const refreshTypes = ['match', 'club', 'stadium', 'season']
      if (refreshTypes.includes(event.detail.type)) {
        refetch()
      }
    }

    window.addEventListener('data-refresh', handleDataRefresh as EventListener)
    return () => {
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener)
    }
  }, [refetch])
  
  return { matches, loading, error, refetch }
}

export function useLatestMatches() {
  const { data, loading, error, refetch } = useApi<any>(API_ENDPOINTS.LATEST_MATCHES)
  const matches = (data && 'results' in (data as any)) ? (data as any).results : (data || [])
  
  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      const refreshTypes = ['match', 'club', 'stadium', 'season', 'player', 'player_stats']
      if (refreshTypes.includes(event.detail.type)) {
        refetch()
      }
    }

    window.addEventListener('data-refresh', handleDataRefresh as EventListener)
    return () => {
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener)
    }
  }, [refetch])
  
  return { matches, loading, error, refetch }
}

export function useMatch(id: string) {
  const { data: match, loading, error, refetch } = useApi<Match>(API_ENDPOINTS.MATCH_DETAIL(id))
  
  return {
    match,
    loading,
    error,
    refetch,
  }
} 