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
  const { data: matches, loading, error, refetch } = useApi<Match[]>(API_ENDPOINTS.UPCOMING_MATCHES)
  
  return {
    matches: matches || [],
    loading,
    error,
    refetch,
  }
}

export function useLatestMatches() {
  const { data: matches, loading, error, refetch } = useApi<Match[]>(API_ENDPOINTS.LATEST_MATCHES)
  
  return {
    matches: matches || [],
    loading,
    error,
    refetch,
  }
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