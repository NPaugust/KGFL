// Утилиты для форматирования данных
export * from './formatting'

export const formatDate = (date: string | Date): string => {
  const d = new Date(date)
  return d.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

export const formatTime = (time: string): string => {
  if (!time) return '';
  
  // Если строка уже в формате HH:MM, возвращаем как есть
  if (/^\d{2}:\d{2}$/.test(time)) {
    return time;
  }
  
  // Если строка в формате HH:MM:SS, обрезаем секунды
  if (/^\d{2}:\d{2}:\d{2}$/.test(time)) {
    return time.slice(0, 5);
  }
  
  return time;
}

export const formatDateTime = (date: string | Date, time?: string): string => {
  const formattedDate = formatDate(date)
  return time ? `${formattedDate}, ${time}` : formattedDate
}

// Форматирование статистики
export const formatGoals = (goalsFor: number, goalsAgainst: number): string => {
  return `${goalsFor}:${goalsAgainst}`
}

export const formatPoints = (points: number): string => {
  return points.toString()
}

// Форматирование позиции в таблице
export const formatPosition = (position: number): string => {
  const suffix = position === 1 ? 'ое' : position === 2 ? 'ое' : position === 3 ? 'ье' : 'ое'
  return `${position}${suffix} место`
}

// Утилиты для работы с цветами статусов
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'live':
      return 'text-red-400'
    case 'finished':
      return 'text-green-400'
    case 'scheduled':
      return 'text-blue-400'
    case 'cancelled':
      return 'text-gray-400'
    default:
      return 'text-white/60'
  }
}

export const getStatusText = (status: string): string => {
  switch (status) {
    case 'live':
      return 'В прямом эфире'
    case 'finished':
      return 'Завершен'
    case 'scheduled':
      return 'Запланирован'
    case 'cancelled':
      return 'Отменен'
    default:
      return 'Неизвестно'
  }
}

// Утилиты для работы с результатами матчей
export const getMatchResult = (homeScore?: number, awayScore?: number): 'home' | 'away' | 'draw' | null => {
  if (homeScore === undefined || awayScore === undefined) return null
  
  if (homeScore > awayScore) return 'home'
  if (awayScore > homeScore) return 'away'
  return 'draw'
}

export const getResultColor = (result: 'home' | 'away' | 'draw' | null): string => {
  switch (result) {
    case 'home':
      return 'text-green-400'
    case 'away':
      return 'text-red-400'
    case 'draw':
      return 'text-yellow-400'
    default:
      return 'text-white/60'
  }
}

// Утилиты для работы с формами команд
export const getFormColor = (form: 'W' | 'D' | 'L'): string => {
  switch (form) {
    case 'W':
      return 'bg-green-400'
    case 'D':
      return 'bg-yellow-300'
    case 'L':
      return 'bg-red-400'
    default:
      return 'bg-gray-400'
  }
}

// Утилиты для поиска и фильтрации
export const searchFilter = <T extends Record<string, any>>(
  items: T[],
  query: string,
  searchFields: (keyof T)[]
): T[] => {
  if (!query.trim()) return items
  
  const lowercaseQuery = query.toLowerCase()
  
  return items.filter(item =>
    searchFields.some(field => {
      const value = item[field]
      return value && value.toString().toLowerCase().includes(lowercaseQuery)
    })
  )
}

// Утилиты для пагинации
export const paginate = <T>(items: T[], page: number, limit: number): T[] => {
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  return items.slice(startIndex, endIndex)
}

// Утилиты для валидации
export * from './validation'

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Утилиты для работы с URL
export const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, value.toString())
    }
  })
  
  return searchParams.toString()
}

// Утилиты для работы с классами
export const cn = (...classes: (string | undefined | null | false)[]): string => {
  return classes.filter(Boolean).join(' ')
}

// Утилиты для работы с изображениями
export const getImageUrl = (path: string): string => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  // Формируем абсолютный URL до бэкенда
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  let origin: string
  try {
    origin = new URL(apiUrl).origin
  } catch {
    origin = 'http://localhost:8000'
  }
  const normalized = path.startsWith('/') ? path : `/${path}`
  return `${origin}${normalized}`
}

// Утилиты для работы с числами
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ru-RU').format(num)
}

export const formatPercentage = (value: number, total: number): string => {
  if (total === 0) return '0%'
  return `${Math.round((value / total) * 100)}%`
} 