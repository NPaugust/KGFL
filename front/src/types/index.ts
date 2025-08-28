// Основные типы данных для KGFL

export interface Club {
  id: string
  name: string
  logo: string
  city: string
  founded?: number
  stadium?: string
  coach?: string
  website?: string
}

export interface Player {
  id: string
  first_name: string
  last_name: string
  number?: number
  club?: Club
  clubLogo?: string
  photo?: string
  position?: 'GK' | 'DF' | 'MF' | 'FW'
  goals_scored?: number
  assists?: number
  yellowCards?: number
  redCards?: number
  age?: number
  nationality?: string
  date_of_birth?: string
  height?: number
  weight?: number
  bio?: string
}

export interface Match {
  id: string
  date: string
  time?: string
  home_team?: Club
  away_team?: Club
  home_score?: number
  away_score?: number
  stadium?: string
  status: 'scheduled' | 'live' | 'finished' | 'cancelled'
  round?: number
  season?: string
  referee?: Referee
  attendance?: number
  highlights?: string
}

export interface TableRow {
  id: string
  club?: Club
  played: number
  win: number
  draw: number
  loss: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
  last_5?: Array<'W' | 'D' | 'L'>
  position: number
  season?: string
}

export interface Season {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

export interface Referee {
  id: string
  name: string
  photo: string
  category: string
  experience: number
  matches: number
}

export interface Manager {
  id: string
  name: string
  position: string
  photo: string
  bio?: string
  contact?: string
}

export interface Partner {
  id: string
  name: string
  logo: string
  website?: string
  category: 'main' | 'official' | 'technical'
}

// Типы для фильтров и поиска
export interface FilterOptions {
  season?: string
  club?: string
  position?: string
  status?: string
}

export interface SearchParams {
  query?: string
  filters?: FilterOptions
  page?: number
  limit?: number
}

// Типы для API ответов
export interface ApiResponse<T> {
  data: T
  success: boolean
  message?: string
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  message: string
  code: string
  details?: any
} 