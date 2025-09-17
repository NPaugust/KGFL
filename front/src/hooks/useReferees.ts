"use client"
import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/services/api'
import { API_ENDPOINTS } from '@/services/api'
import { Referee, PaginatedResponse } from '@/types'

export function useReferees() {
  const [referees, setReferees] = useState<Referee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchReferees = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiClient.get<PaginatedResponse<Referee> | Referee[]>(API_ENDPOINTS.REFEREES)
      // Обрабатываем пагинацию
      if (result && typeof result === 'object' && 'results' in result) {
        setReferees((result as PaginatedResponse<Referee>).results)
      } else {
        setReferees(result as Referee[] || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  // Слушаем события обновления данных
  useEffect(() => {
    const handleDataRefresh = (event: CustomEvent) => {
      if (event.detail.type === 'referee') {
        console.log('Обновляем судей...', event.detail.type)
        fetchReferees()
      }
    }

    window.addEventListener('data-refresh', handleDataRefresh as EventListener)
    return () => {
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener)
    }
  }, [])

  useEffect(() => {
    fetchReferees()
  }, [refreshKey])

  const refetch = () => {
    setRefreshKey(prev => prev + 1)
  }

  return {
    referees: referees || [],
    loading,
    error,
    refetch,
  }
}

export function useReferee(id: string) {
  const [referee, setReferee] = useState<Referee | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReferee = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiClient.get<Referee>(API_ENDPOINTS.REFEREES_DETAIL(id))
      setReferee(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchReferee()
    }
  }, [id, fetchReferee])

  return {
    referee,
    loading,
    error,
    refetch: fetchReferee,
  }
} 