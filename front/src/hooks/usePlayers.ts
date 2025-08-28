"use client"
import { useApi } from './useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Player } from '@/types'

export function usePlayers() {
  const { data: players, loading, error, refetch } = useApi<any>(API_ENDPOINTS.PLAYERS)
  
  // Обрабатываем пагинацию
  const playersData = players?.results || players || []

  return {
    players: playersData,
    loading,
    error,
    refetch,
  }
}

export function useTopScorers() {
  const { data: scorers, loading, error, refetch } = useApi<Player[]>(API_ENDPOINTS.TOP_SCORERS)
  
  return {
    scorers: scorers || [],
    loading,
    error,
    refetch,
  }
}

export function usePlayer(id: string) {
  const { data: player, loading, error, refetch } = useApi<Player>(API_ENDPOINTS.PLAYER_DETAIL(id))
  
  return {
    player,
    loading,
    error,
    refetch,
  }
} 