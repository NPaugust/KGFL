// Основные типы данных для KGFL

export interface Club {
  id: string
  name: string
  short_name?: string
  logo?: string
  logo_url?: string
  city: string
  founded?: number
  stadium?: string
  coach?: string
  website?: string
  is_active?: boolean
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
  yellow_cards?: number
  redCards?: number
  red_cards?: number
  age?: number
  nationality?: string
  date_of_birth?: string
  height?: number
  weight?: number
  bio?: string
  games_played?: number
  minutes_played?: number
  season?: string
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
  club_name?: string
  club_logo?: string
  club?: Club
  played?: number
  matches_played?: number
  win?: number
  wins?: number
  draw?: number
  draws?: number
  loss?: number
  losses?: number
  goals_for: number
  goals_against: number
  goal_difference: number
  points: number
  last_5?: Array<'W' | 'D' | 'L'>
  position: number
  season?: string
  goals_formatted?: string
}

export interface Season {
  id: string
  name: string
  startDate?: string
  start_date?: string
  endDate?: string
  end_date?: string
  isActive?: boolean
  is_active?: boolean
}

export interface Referee {
  id: string
  name: string
  photo?: string
  photo_url?: string
  category?: string
  position?: string
  experience?: number
  matches?: number
  bio?: string
  is_active?: boolean
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

export interface Media {
  id: string
  title: string
  description?: string
  image?: string
  image_url?: string
  category?: string
  is_active?: boolean
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

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiError {
  message: string
  code: string
  details?: any
} 