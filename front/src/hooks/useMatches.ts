"use client"
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Match } from '@/types'
import { useEffect } from 'react'

export function useMatches() {
  const { data: matches, loading, error, refetch } = useApi<any>(API_ENDPOINTS.MATCHES)
  
  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      const refreshTypes = ['match', 'club', 'stadium', 'season', 'player', 'player_stats']
      if (refreshTypes.includes(event.detail.type)) {
        console.log('Обновляем матчи...', event.detail.type)
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
        console.log('Обновляем предстоящие матчи...', event.detail.type)
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
        console.log('Обновляем последние матчи...', event.detail.type)
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