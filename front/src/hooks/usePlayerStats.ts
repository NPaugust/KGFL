"use client"
import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/services/api'
import { API_ENDPOINTS } from '@/services/api'
import { useSeasonStore } from '@/store/useSeasonStore'

export interface PlayerStats {
  matches_played: number
  matches_started: number
  minutes_played: number
  goals: number
  assists: number
  yellow_cards: number
  red_cards: number
  clean_sheets: number
}

export function usePlayerStats(playerId: string | null) {
  const { selectedSeasonId } = useSeasonStore()
  const [stats, setStats] = useState<PlayerStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    if (!playerId) {
      setStats(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      // Передаем season в query параметрах (если "Все сезоны" - не передаем, иначе передаем ID)
      const params: any = {}
      if (selectedSeasonId) {
        params.season = selectedSeasonId
      }
      
      const url = `${API_ENDPOINTS.PLAYER_STATS(playerId)}${selectedSeasonId ? `?season=${selectedSeasonId}` : ''}`
      const result = await apiClient.get<PlayerStats>(url)
      setStats(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
      // Устанавливаем пустую статистику при ошибке
      setStats({
        matches_played: 0,
        matches_started: 0,
        minutes_played: 0,
        goals: 0,
        assists: 0,
        yellow_cards: 0,
        red_cards: 0,
        clean_sheets: 0
      })
    } finally {
      setLoading(false)
    }
  }, [playerId, selectedSeasonId])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      const refreshTypes = ['match', 'player', 'player_stats', 'goal', 'card', 'substitution', 'assist']
      if (refreshTypes.includes(event.detail.type)) {
        fetchStats()
      }
    }

    window.addEventListener('data-refresh', handleDataRefresh as EventListener)
    return () => {
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener)
    }
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  }
}
