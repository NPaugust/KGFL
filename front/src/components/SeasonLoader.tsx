"use client"
import { useEffect } from 'react'
import { useSeasonStore } from '@/store/useSeasonStore'

export function SeasonLoader() {
  const { fetchSeasons } = useSeasonStore()
  
  useEffect(() => {
    // Загружаем сезоны только один раз при монтировании
    fetchSeasons()
  }, [fetchSeasons])
  
  // Этот компонент ничего не рендерит, только загружает данные
  return null
}
