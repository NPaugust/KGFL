"use client"

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/services/api'
import { PaginatedResponse } from '@/types'

export function useApi<T = any>(
  url: string, 
  params?: Record<string, any>, 
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Fetching data from:', url)
      const result = await apiClient.get<T>(url, { params })
      console.log('API response:', result)
      
      // Проверяем, есть ли пагинация
      if (result && typeof result === 'object' && 'results' in result) {
        console.log('Paginated response detected, setting results')
        setData((result as any).results as T)
      } else {
        console.log('Direct response detected, setting data')
        setData(result as T)
      }
    } catch (err) {
      console.error('Error in useApi hook:', err)
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [url, params])

  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  useEffect(() => {
    fetchData()
    
    // Слушаем события обновления данных
    const handleDataUpdate = (event: CustomEvent) => {
      const { url: updatedUrl, method } = event.detail
      // Если обновление касается нашего URL или связанных данных, обновляем
      if (updatedUrl.includes(url) || method === 'DELETE') {
        fetchData()
      }
    }
    
    // Убираем слушатель season-changed чтобы избежать бесконечных циклов
    
    window.addEventListener('data-updated', handleDataUpdate as EventListener)
    
    return () => {
      window.removeEventListener('data-updated', handleDataUpdate as EventListener)
    }
  }, [url, params, refreshTrigger, fetchData, ...dependencies])

  return { data, loading, error, refetch }
}

export function useApiMutation<T = any>(url?: string, method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE') {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = async (requestUrl: string, requestMethod: 'POST' | 'PUT' | 'PATCH' | 'DELETE', data?: any): Promise<T> => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('API mutation request:', {
        url: requestUrl,
        method: requestMethod,
        data: data
      })

      let result: any
      switch (requestMethod) {
        case 'POST':
          result = await apiClient.post<T>(requestUrl, data)
          break
        case 'PUT':
          result = await apiClient.put<T>(requestUrl, data)
          break
        case 'PATCH':
          result = await apiClient.patch<T>(requestUrl, data)
          break
        case 'DELETE':
          result = await apiClient.delete<T>(requestUrl)
          break
        default:
          throw new Error('Неподдерживаемый метод')
      }
      
      console.log('API mutation response:', result)
      
      // Автоматически обновляем данные после успешной мутации
      if (typeof window !== 'undefined') {
        // Триггерим событие для обновления связанных данных
        window.dispatchEvent(new CustomEvent('data-updated', { 
          detail: { url: requestUrl, method: requestMethod } 
        }))
      }
      
      return result
    } catch (err: any) {
      console.error('API mutation error:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Произошла ошибка'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const mutateAsync = async (requestUrl: string, requestMethod: 'POST' | 'PUT' | 'PATCH' | 'DELETE', data?: any): Promise<T> => {
    return mutate(requestUrl, requestMethod, data)
  }

  return { mutate, mutateAsync, loading, error }
} 