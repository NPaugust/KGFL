import { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'

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
      console.log('Fetching data from:', url, 'with params:', params)
      const result = await apiClient.get<T>(url, params)
      console.log('Data received:', result)
      setData(result)
    } catch (err) {
      console.error('Error in useApi:', err)
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

export function useApiMutation<T, D = any>(url: string, method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' = 'POST') {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mutateAsync = async (data?: D) => {
    try {
      setLoading(true)
      setError(null)
      console.log(`Making ${method} request to:`, url, 'with data:', data)
      
      let result: T
      switch (method) {
        case 'POST':
          result = await apiClient.post<T>(url, data)
          break
        case 'PUT':
          result = await apiClient.put<T>(url, data)
          break
        case 'PATCH':
          result = await apiClient.patch<T>(url, data)
          break
        case 'DELETE':
          result = await apiClient.delete<T>(url)
          break
        default:
          throw new Error('Неподдерживаемый метод')
      }
      
      console.log(`${method} request successful:`, result)
      return result
    } catch (err: any) {
      console.error(`Error in ${method} request:`, err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Произошла ошибка'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { mutateAsync, loading, error }
} 