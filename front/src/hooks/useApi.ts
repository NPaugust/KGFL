"use client"

import { useState, useEffect, useCallback } from 'react'
import { apiClient } from '@/services/api'
import { PaginatedResponse } from '@/types'

export function useApi<T = any>(
  url: string | null,
  params?: Record<string, any>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  // ВАЖНО: мемоизируем ключ параметров, чтобы избежать бесконечных перерендеров
  const paramsKey = JSON.stringify(params || {})

  const fetchData = useCallback(async () => {
    if (!url) {
      setLoading(false)
      setData(null)
      return
    }
    
    try {
      setLoading(true)
      setError(null)
      
      const parsedParams = paramsKey ? JSON.parse(paramsKey) : undefined
      // cache-buster чтобы не получать закешированный список после создания
      const result = await apiClient.get<T>(url, { ...(parsedParams || {}), _ts: Date.now() })
      
      // Проверяем, есть ли пагинация
      if (result && typeof result === 'object' && 'results' in result) {
        setData((result as any).results as T)
      } else {
        setData(result as T)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [url, paramsKey])

  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  useEffect(() => {
    let isMounted = true
    // защита от двойного вызова useEffect в StrictMode при dev
    const call = async () => {
      await fetchData()
    }
    if (isMounted) call()
    
    const handleDataUpdate = (event: CustomEvent) => {
      const { url: updatedUrl, method } = event.detail
      if (url && (updatedUrl.includes(url) || method === 'DELETE')) {
        fetchData()
      }
    }
    
    window.addEventListener('data-updated', handleDataUpdate as EventListener)
    
    return () => {
      isMounted = false
      window.removeEventListener('data-updated', handleDataUpdate as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, paramsKey, refreshTrigger, fetchData, ...dependencies])

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
      
      // Автоматически обновляем данные после успешной мутации
      if (typeof window !== 'undefined') {
        const detail = { url: requestUrl, method: requestMethod }
        window.dispatchEvent(new CustomEvent('data-updated', { detail }))
        // Дополнительно: дергаем корневой список (например, /players/ для /players/123/)
        try {
          const normalized = requestUrl.endsWith('/') ? requestUrl : `${requestUrl}/`
          const base = normalized.replace(/\d+\/?$/, '')
          if (base && base !== requestUrl) {
            window.dispatchEvent(new CustomEvent('data-updated', { detail: { url: base, method: requestMethod } }))
          }
        } catch {}
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