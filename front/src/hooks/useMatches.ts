"use client"
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Match } from '@/types'

export function useMatches() {
  const { data: matches, loading, error, refetch } = useApi<any>(API_ENDPOINTS.MATCHES)
  
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
  return { matches, loading, error, refetch }
}

export function useLatestMatches() {
  const { data, loading, error, refetch } = useApi<any>(API_ENDPOINTS.LATEST_MATCHES)
  const matches = (data && 'results' in (data as any)) ? (data as any).results : (data || [])
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