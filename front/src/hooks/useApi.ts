import { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'
import { PaginatedResponse } from '@/types'

export function useApi<T>(
  url: string,
  params?: any,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiClient.get<T | PaginatedResponse<T>>(url, params)
      
      // Обрабатываем пагинацию
      if (result && typeof result === 'object' && 'results' in result) {
        setData((result as PaginatedResponse<T>).results as T)
      } else {
        setData(result as T)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  const refetch = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  useEffect(() => {
    fetchData()
  }, [url, params, refreshTrigger, ...dependencies])

  return { data, loading, error, refetch }
}

export function useApiMutation<T = any>(url?: string, method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE') {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutate = async (requestUrl: string, requestMethod: 'POST' | 'PUT' | 'PATCH' | 'DELETE', data?: any): Promise<T> => {
    try {
      setLoading(true)
      setError(null)

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
      return result
    } catch (err: any) {
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