// Основные типы данных для KGFL

export interface Club {
  id: string
  name: string
  short_name?: string
  logo?: string
  logo_url?: string
  city: string
  founded?: number
  primary_kit_color?: string
  secondary_kit_color?: string
  coach_full_name?: string
  assistant_full_name?: string
  captain_full_name?: string
  contact_phone?: string
  contact_email?: string
  social_media?: string
  description?: string
  participation_fee?: 'yes' | 'no' | 'partial'
  status?: 'applied' | 'active' | 'disqualified' | 'withdrawn'
  website?: string
  is_active?: boolean
  stadium_name?: string
}

export interface Player {
  id: string
  first_name: string
  last_name: string
  number?: number
  club?: Club
  club_id?: number
  clubLogo?: string
  photo?: string
  position?: 'GK' | 'DF' | 'MF' | 'FW'
  status?: 'applied' | 'active' | 'injured' | 'disqualified' | 'loan' | 'withdrawn'
  phone?: string
  notes?: string
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

export interface PlayerTransfer {
  id: string
  player: Player | string
  player_name?: string
  player_position?: string
  from_club?: Club | string | null
  from_club_name?: string
  to_club: Club | string
  to_club_name?: string
  transfer_date: string
  transfer_type?: string
  status: 'confirmed' | 'pending' | 'cancelled'
  transfer_fee?: string | number
  notes?: string
  season_name?: string
  created_at?: string
}

export interface Match {
  id: string
  date: string
  time?: string
  home_team?: Club
  home_team_name?: string
  away_team?: Club
  away_team_name?: string
  home_score?: number
  away_score?: number
  stadium?: string
  status: 'scheduled' | 'live' | 'finished' | 'postponed'
  round?: number
  season?: string
  referee?: Referee
  attendance?: number
  highlights?: string
}

export interface TableRow {
  id: string
  club_id?: number
  club_name?: string
  club_logo?: string
  club?: Club
  played?: number
  matches_played?: number
  games?: number
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
  name?: string
  first_name?: string
  last_name?: string
  nationality?: string
  photo?: string
  photo_url?: string
  category?: string
  region?: string
  experience_months?: number
  experience?: number
  matches?: number
  bio?: string
  is_active?: boolean
  phone?: string
}

export interface Manager {
  id: string
  first_name?: string;
  last_name?: string;
  full_name?: string;
  position: string
  photo?: string
  photo_url?: string;
  bio?: string
  contact?: string
  phone?: string
  email?: string
  notes?: string
  is_active?: boolean;
}

export interface Partner {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  is_active?: boolean;
  description?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  partnership_type?: string;
}

export interface Media {
  id: string;
  title: string;
  description?: string;
  file?: string;
  file_url?: string;
  media_type?: 'image' | 'video' | 'document';
  url?: string;
  is_active?: boolean;
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

// Типы для событий матчей
export interface Goal {
  id: string
  match: string | number
  player: string | number
  player_name?: string
  team: string | number
  team_name?: string
  minute: number
  assist_player?: string | number | null
  assist_player_name?: string
  goal_type?: string
  created_at?: string
}

export interface Card {
  id: string
  match: string | number
  player: string | number
  player_name?: string
  team: string | number
  team_name?: string
  minute: number
  card_type: 'yellow' | 'red'
  reason?: string
  created_at?: string
}

export interface Substitution {
  id: string
  match: string | number
  player_out: string | number
  player_out_name?: string
  player_in: string | number
  player_in_name?: string
  team: string | number
  team_name?: string
  minute: number
  reason?: string
  created_at?: string
}

// Типы для заявок клубов
export interface ClubApplication {
  id: string
  club_name: string
  short_name?: string
  city: string
  founded?: number
  contact_person: string
  contact_phone: string
  contact_email?: string
  coach_name: string
  assistant_coach?: string
  logo?: string
  documents?: string
  status: 'pending' | 'approved' | 'rejected' | 'withdrawn'
  description?: string
  notes?: string
  club?: Club | null
  season: string | number
  season_name?: string
  created_at: string
  updated_at?: string
  reviewed_at?: string
  reviewed_by?: string | number | null
  reviewed_by_name?: string
} 