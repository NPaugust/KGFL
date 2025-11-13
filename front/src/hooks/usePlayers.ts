"use client"
import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/services/api'
import { API_ENDPOINTS } from '@/services/api'
import { Player, PaginatedResponse } from '@/types'
import { useSeasonStore } from '@/store/useSeasonStore'

export function usePlayers() {
  const { selectedSeasonId } = useSeasonStore()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchPlayers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      // Добавляем cache-busting timestamp и фильтр по сезону
      const params: any = { _ts: Date.now() }
      if (selectedSeasonId && selectedSeasonId.trim() !== '') {
        params.season = selectedSeasonId
      }
      // Если selectedSeasonId пустой - не передаем параметр, бэкенд вернет всех игроков
      
      const url = `${API_ENDPOINTS.PLAYERS}?${new URLSearchParams(params).toString()}`
      const result = await apiClient.get<PaginatedResponse<Player> | Player[]>(url)
      // Обрабатываем пагинацию
      if (result && typeof result === 'object' && 'results' in result) {
        setPlayers((result as PaginatedResponse<Player>).results)
      } else {
        setPlayers(result as Player[] || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }, [selectedSeasonId])

  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      const refreshTypes = ['match', 'player', 'player_stats', 'club', 'transfer']
      if (refreshTypes.includes(event.detail.type)) {
        fetchPlayers()
      }
    }

    window.addEventListener('data-refresh', handleDataRefresh as EventListener)
    return () => {
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener)
    }
  }, [fetchPlayers])

  useEffect(() => {
    fetchPlayers()
  }, [refreshKey, fetchPlayers])

  const refetch = () => {
    setRefreshKey(prev => prev + 1)
  }

  return {
    players: players || [],
    loading,
    error,
    refetch,
  }
}

export function usePlayer(id: string) {
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlayer = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiClient.get<Player>(API_ENDPOINTS.PLAYER_DETAIL(id))
      setPlayer(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchPlayer()
    }
  }, [id, fetchPlayer])

  return {
    player,
    loading,
    error,
    refetch: fetchPlayer,
  }
}

export function useTopScorers() {
  const { selectedSeasonId } = useSeasonStore()
  const [topScorers, setTopScorers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTopScorers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const ts = Date.now()
      const params: any = { _ts: ts }
      if (selectedSeasonId && selectedSeasonId.trim() !== '') {
        params.season = selectedSeasonId
      }
      const url = `${API_ENDPOINTS.TOP_SCORERS}?${new URLSearchParams(params).toString()}`
      const result = await apiClient.get<Player[]>(url)
      setTopScorers(result || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }, [selectedSeasonId])

  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      const refreshTypes = ['match', 'player', 'player_stats', 'club', 'transfer']
      if (refreshTypes.includes(event.detail.type)) {
        fetchTopScorers()
      }
    }

    window.addEventListener('data-refresh', handleDataRefresh as EventListener)
    return () => {
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener)
    }
  }, [fetchTopScorers])

  useEffect(() => {
    fetchTopScorers()
  }, [fetchTopScorers])

  return {
    topScorers: topScorers || [],
    loading,
    error,
    refetch: fetchTopScorers,
  }
}

export function useTransfers() {
  const [transfers, setTransfers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        setLoading(true)
        const res = await apiClient.get<any[]>(API_ENDPOINTS.PLAYER_TRANSFERS)
        setTransfers(Array.isArray(res) ? res : [])
      } catch (e:any) {
        setError(e?.message || 'Ошибка')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  return { transfers, loading, error }
}