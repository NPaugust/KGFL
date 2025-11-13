import { create } from 'zustand'
import { API_ENDPOINTS } from '@/services/api'
import { apiClient } from '@/services/api'

export type Season = {
  id: string
  name: string
  is_active?: boolean
  start_date?: string
  end_date?: string
  description?: string
}

type State = {
  seasons: Season[]
  selectedSeasonId: string
  selectedGroupId: string | null
  loading: boolean
  error: string | null
  setSeason: (id: string) => void
  setGroup: (id: string | null) => void
  fetchSeasons: () => Promise<void>
}

export const useSeasonStore = create<State>((set, get) => ({
  seasons: [],
  selectedSeasonId: '',
  selectedGroupId: null,
  loading: false,
  error: null,
  
  setSeason: (id) => {
    set({ selectedSeasonId: id, selectedGroupId: null }) // Сбрасываем группу при смене сезона
    // Убираем автоматические события чтобы избежать бесконечных циклов
  },
  
  setGroup: (id) => {
    set({ selectedGroupId: id })
  },
  
  fetchSeasons: async () => {
    try {
      set({ loading: true, error: null })
      
      const response = await apiClient.get(API_ENDPOINTS.SEASONS)
      const seasonsData = (response as any).data || response
      
      // Проверяем, есть ли пагинация
      let seasonsArray: any[]
      if (seasonsData && typeof seasonsData === 'object' && 'results' in seasonsData) {
        // Пагинированный ответ
        seasonsArray = seasonsData.results
      } else if (Array.isArray(seasonsData)) {
        // Прямой массив
        seasonsArray = seasonsData
      } else {
        throw new Error('Неизвестный формат данных сезонов')
      }
      
      // Проверяем, что seasonsArray это массив
      if (!Array.isArray(seasonsArray)) {
        throw new Error('Неверный формат данных сезонов')
      }
      
      // Преобразуем данные в нужный формат
      const seasons = seasonsArray.map((season: any) => ({
        id: season.id.toString(),
        name: season.name,
        is_active: season.is_active,
        start_date: season.start_date,
        end_date: season.end_date,
        description: season.description
      }))
      
      // По умолчанию выбираем активный сезон, если он есть
      const activeSeason = seasons.find(s => s.is_active)
      const defaultSeasonId = activeSeason ? activeSeason.id : ''
      
      set({ 
        seasons,
        selectedSeasonId: defaultSeasonId,
        loading: false 
      })
      
      // Убираем автоматические события чтобы избежать бесконечных циклов
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Ошибка загрузки сезонов',
        loading: false 
      })
    }
  }
}))

// Инициализируем загрузку сезонов при создании store
if (typeof window !== 'undefined') {
  setTimeout(() => {
    useSeasonStore.getState().fetchSeasons()
  }, 100)
}


