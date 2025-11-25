"use client"
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Match } from '@/types'
import { useEffect, useMemo } from 'react'
import { useSeasonStore } from '@/store/useSeasonStore'

export function useMatches() {
  const { selectedSeasonId } = useSeasonStore()
  
  // Формируем URL с параметрами (без _ts, он будет добавлен в useApi)
  const url = useMemo(() => {
    const params: any = {}
    if (selectedSeasonId && selectedSeasonId.trim() !== '') {
      params.season = selectedSeasonId
    }
    const queryString = new URLSearchParams(params).toString()
    return queryString ? `${API_ENDPOINTS.MATCHES}?${queryString}` : API_ENDPOINTS.MATCHES
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

const getMatchDateValue = (match: any, fallbackFuture = false) => {
  if (!match || !match.date) {
    return fallbackFuture ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER
  }

  const timeRaw = (match as any).time || (match as any).match_time || '00:00'
  const normalizedTime = timeRaw.length === 5 ? `${timeRaw}:00` : (timeRaw || '00:00:00')

  const timestamp = Date.parse(`${match.date}T${normalizedTime}`)
  if (Number.isNaN(timestamp)) {
    return fallbackFuture ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER
  }
  return timestamp
}

const nowMs = () => Date.now()

export function useUpcomingMatches() {
  const { matches, loading, error } = useMatches()

  const upcomingMatches = useMemo(() => {
    const list = Array.isArray(matches) ? matches : []
    const now = nowMs()

    return [...list]
      .filter((match: any) => {
        const matchTime = getMatchDateValue(match, true)
        const isFutureDate = matchTime >= now
        const status = (match.status || '').toLowerCase()
        const isScheduled = ['scheduled', 'live'].includes(status)
        return isFutureDate || isScheduled
      })
      .sort((a, b) => getMatchDateValue(a, true) - getMatchDateValue(b, true))
      .slice(0, 5)
  }, [matches])

  return { matches: upcomingMatches, loading, error }
}

export function useLatestMatches() {
  const { matches, loading, error } = useMatches()

  const latestMatches = useMemo(() => {
    const list = Array.isArray(matches) ? matches : []
    const now = nowMs()

    return [...list]
      .filter((match: any) => {
        const status = (match.status || '').toLowerCase()
        if (status === 'finished') return true
        const matchTime = getMatchDateValue(match)
        return matchTime < now && ['scheduled', 'live'].includes(status)
      })
      .sort((a, b) => getMatchDateValue(b) - getMatchDateValue(a))
      .slice(0, 5)
  }, [matches])

  return { matches: latestMatches, loading, error }
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