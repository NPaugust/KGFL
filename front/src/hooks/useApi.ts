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
      // Убираем _ts из URL, так как он уже может быть в parsedParams
      const params = { ...(parsedParams || {}) }
      if (!params._ts) {
        params._ts = Date.now()
      }
      const result = await apiClient.get<T>(url, params)
      
      // Проверяем, есть ли пагинация
      if (result && typeof result === 'object' && 'results' in result) {
        setData((result as any).results as T)
      } else {
        setData(result as T)
      }
    } catch (err: any) {
      // Улучшенная обработка ошибок сети
      if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
        setError('Превышено время ожидания. Проверьте подключение к серверу.')
      } else if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        setError('Ошибка сети. Убедитесь, что сервер запущен.')
      } else {
        const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка'
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }, [url, paramsKey])

  const refetch = useCallback(() => {
    setRefreshTrigger(prev => prev + 1)
  }, [])

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout | null = null
    
    // защита от двойного вызова useEffect в StrictMode при dev
    const call = async () => {
      // Небольшая задержка при перезапуске dev сервера, чтобы дать API время запуститься
      if (process.env.NODE_ENV === 'development') {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      if (isMounted) {
        await fetchData()
      }
    }
    
    // Таймаут для предотвращения бесконечной загрузки (35 секунд, больше чем axios timeout)
    timeoutId = setTimeout(() => {
      if (isMounted && loading) {
        setError('Превышено время ожидания ответа от сервера')
        setLoading(false)
      }
    }, 35000) // 35 секунд максимум (больше чем axios timeout 30 секунд)
    
    call()
    
    const handleDataUpdate = (event: CustomEvent) => {
      const { url: updatedUrl, method } = event.detail
      if (url && (updatedUrl.includes(url) || method === 'DELETE')) {
        if (isMounted) {
          fetchData()
        }
      }
    }
    
    window.addEventListener('data-updated', handleDataUpdate as EventListener)
    
    return () => {
      isMounted = false
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      window.removeEventListener('data-updated', handleDataUpdate as EventListener)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, paramsKey, refreshTrigger, ...dependencies])

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