"use client"
import { useState, useEffect } from 'react'
import { apiClient } from '@/services/api'
import { API_ENDPOINTS } from '@/services/api'
import { Media, PaginatedResponse } from '@/types'

export function useMedia() {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchMedia = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiClient.get<PaginatedResponse<Media> | Media[]>(API_ENDPOINTS.MEDIA)
      // Обрабатываем пагинацию
      if (result && typeof result === 'object' && 'results' in result) {
        setMedia((result as PaginatedResponse<Media>).results)
      } else {
        setMedia(result as Media[] || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedia()
  }, [refreshKey])

  const refetch = () => {
    setRefreshKey(prev => prev + 1)
  }

  return {
    media: media || [],
    loading,
    error,
    refetch,
  }
}

export function useMediaByCategory(category: string) {
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchMediaByCategory = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await apiClient.get<Media[]>(`${API_ENDPOINTS.MEDIA_BY_CATEGORY}?category=${category}`)
      setMedia(result || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMediaByCategory()
  }, [category, refreshKey])

  const refetch = () => {
    setRefreshKey(prev => prev + 1)
  }

  return {
    media: media || [],
    loading,
    error,
    refetch,
  }
} 