"use client"
import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/services/api'
import { API_ENDPOINTS } from '@/services/api'
import { Manager, PaginatedResponse } from '@/types'

export function useManagement() {
  const [management, setManagement] = useState<Manager[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchManagement = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiClient.get<PaginatedResponse<Manager> | Manager[]>(API_ENDPOINTS.MANAGEMENT)
      // Обрабатываем пагинацию
      if (result && typeof result === 'object' && 'results' in result) {
        setManagement((result as PaginatedResponse<Manager>).results)
      } else {
        setManagement(result as Manager[] || [])
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
      if (event.detail.type === 'management') {
        fetchManagement()
      }
    }

    window.addEventListener('data-refresh', handleDataRefresh as EventListener)
    return () => {
      window.removeEventListener('data-refresh', handleDataRefresh as EventListener)
    }
  }, [])

  useEffect(() => {
    fetchManagement()
  }, [refreshKey])

  const refetch = () => {
    setRefreshKey(prev => prev + 1)
  }

  return {
    management: management || [],
    loading,
    error,
    refetch,
  }
}

export function useManager(id: string) {
  const [manager, setManager] = useState<Manager | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchManager = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiClient.get<Manager>(API_ENDPOINTS.MANAGEMENT_DETAIL(id))
      setManager(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) {
      fetchManager()
    }
  }, [id, fetchManager])

  return {
    manager,
    loading,
    error,
    refetch: fetchManager,
  }
} 