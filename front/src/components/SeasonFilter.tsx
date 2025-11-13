"use client"
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useSeasonStore } from '@/store/useSeasonStore'
import { SelectMenu } from './Filters'

export function SeasonFilter() {
  const { seasons, selectedSeasonId, setSeason } = useSeasonStore()
  const pathname = usePathname()
  const prevPathnameRef = useRef<string | null>(null)
  
  // Сбрасываем фильтр на "Все сезоны" при переходе на другую страницу
  useEffect(() => {
    // Если это первая загрузка или маршрут изменился
    if (prevPathnameRef.current !== null && prevPathnameRef.current !== pathname) {
      // Сбрасываем фильтр только если был выбран конкретный сезон
      const currentSeasonId = useSeasonStore.getState().selectedSeasonId
      if (currentSeasonId && currentSeasonId.trim() !== '') {
        setSeason('')
      }
    }
    // Сохраняем текущий маршрут
    prevPathnameRef.current = pathname
  }, [pathname, setSeason]) // Убрали selectedSeasonId из зависимостей
  
  // Добавляем опцию "Все сезоны" в начало списка
  const options = [
    { label: 'Все сезоны', value: '' },
    ...seasons.map((s) => ({ label: s.name, value: s.id }))
  ]
  
  return (
    <SelectMenu
      label="Сезоны"
      value={selectedSeasonId || ''}
      onChange={(id) => setSeason(id || '')}
      options={options}
    />
  )
}


