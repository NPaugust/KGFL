import axios, { AxiosInstance, AxiosResponse } from 'axios'

const getBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_API_URL is not defined in your environment variables");
  }
  return url;
}

// Конфигурация API
const API_CONFIG = {
  BASE_URL: getBaseUrl(),
  TIMEOUT: 10000,
}

// Типы для API ответов
export interface ApiResponse<T> {
  data: T
  status: number
  message?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

// API клиент
class ApiClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
    })

    // Интерцептор для добавления токена
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token')
        console.log('Request interceptor - Token:', token ? 'Present' : 'Missing')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
          console.log('Authorization header set:', config.headers.Authorization)
        } else {
          console.log('No token found in localStorage')
        }
        console.log('Request config:', {
          url: config.url,
          method: config.method,
          headers: config.headers,
          data: config.data
        })
        return config
      },
      (error) => {
        console.error('Request interceptor error:', error)
        return Promise.reject(error)
      }
    )

    // Интерцептор для обработки ошибок
    this.client.interceptors.response.use(
      (response) => {
        console.log('Response interceptor - Success:', {
          status: response.status,
          url: response.config.url,
          data: response.data
        })
        return response
      },
      async (error) => {
        console.error('Response interceptor - Error:', {
          status: error.response?.status,
          url: error.config?.url,
          message: error.response?.data,
          headers: error.response?.headers
        })
        
        if (error.response?.status === 401) {
          console.log('401 Unauthorized - attempting token refresh')
          // Попытка обновить токен только если это не запрос на обновление токена
          if (!error.config.url?.includes('/token/refresh/')) {
            const refreshToken = localStorage.getItem('refresh_token')
            if (refreshToken) {
              try {
                console.log('Attempting to refresh token...')
                const response = await this.refreshToken(refreshToken)
                const access = response.data?.access
                if (!access) {
                  throw new Error('No access token in refresh response')
                }
                localStorage.setItem('access_token', access)
                console.log('Token refreshed successfully')
                
                // Повторяем оригинальный запрос
                error.config.headers.Authorization = `Bearer ${access}`
                return this.client.request(error.config)
              } catch (refreshError) {
                console.error('Token refresh failed:', refreshError)
                // Если не удалось обновить токен, перенаправляем на логин
                localStorage.removeItem('access_token')
                localStorage.removeItem('refresh_token')
                if (typeof window !== 'undefined') {
                  window.location.href = '/login'
                }
              }
            } else {
              console.log('No refresh token found')
            }
          }
        }
        
        // Улучшенная обработка ошибок
        if (error.response?.data) {
          error.message = error.response.data.message || error.response.data.detail || error.message
        }
        
        return Promise.reject(error)
      }
    )
  }

  // Методы для работы с токенами
  async login(username: string, password: string) {
    console.log('Login attempt for user:', username)
    const response = await this.client.post('/users/login/', { username, password })
    console.log('Login response:', response.data)
    return response.data
  }

  async refreshToken(refreshToken: string) {
    console.log('Refreshing token...')
    return this.client.post('/token/refresh/', { refresh: refreshToken })
  }

  async verifyToken(token: string) {
    console.log('Verifying token...')
    return this.client.post('/token/verify/', { token })
  }

  // Методы для работы с данными
  async get<T>(url: string, params?: any): Promise<T> {
    try {
      console.log('API GET Request:', `${this.client.defaults.baseURL}${url}`, params)
      const response: AxiosResponse<T> = await this.client.get(url, { params })
      console.log('API GET Response:', response.data)
      return response.data
    } catch (error) {
      console.error('API GET Error:', error)
      throw error
    }
  }

  async post<T>(url: string, data?: any): Promise<T> {
    try {
      console.log('API POST Request:', `${this.client.defaults.baseURL}${url}`, data)
      
      const config = data instanceof FormData 
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : { headers: { 'Content-Type': 'application/json' } };
      
      const response: AxiosResponse<T> = await this.client.post(url, data, config)
      console.log('API POST Response:', response.data)
      return response.data
    } catch (error) {
      console.error('API POST Error:', error)
      throw error
    }
  }

  async put<T>(url: string, data?: any): Promise<T> {
    try {
      console.log('API PUT Request:', `${this.client.defaults.baseURL}${url}`, data)
      
      const config = data instanceof FormData 
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : { headers: { 'Content-Type': 'application/json' } };
      
      const response: AxiosResponse<T> = await this.client.put(url, data, config)
      console.log('API PUT Response:', response.data)
      return response.data
    } catch (error) {
      console.error('API PUT Error:', error)
      throw error
    }
  }

  async patch<T>(url: string, data?: any): Promise<T> {
    try {
      console.log('API PATCH Request:', `${this.client.defaults.baseURL}${url}`, data)
      
      const config = data instanceof FormData 
        ? { headers: { 'Content-Type': 'multipart/form-data' } }
        : { headers: { 'Content-Type': 'application/json' } };
      
      const response: AxiosResponse<T> = await this.client.patch(url, data, config)
      console.log('API PATCH Response:', response.data)
      return response.data
    } catch (error) {
      console.error('API PATCH Error:', error)
      throw error
    }
  }

  async delete<T>(url: string): Promise<T> {
    try {
      console.log('API DELETE Request:', `${this.client.defaults.baseURL}${url}`)
      const response: AxiosResponse<T> = await this.client.delete(url)
      console.log('API DELETE Response:', response.data)
      return response.data
    } catch (error) {
      console.error('API DELETE Error:', error)
      throw error
    }
  }
}

export const apiClient = new ApiClient()

// Экспорт для совместимости
export const api = apiClient

// API endpoints
export const API_ENDPOINTS = {
  // Аутентификация
  LOGIN: '/users/login/',
  REFRESH_TOKEN: '/token/refresh/',
  VERIFY_TOKEN: '/token/verify/',
  
  // Core
  SEASONS: '/seasons/',
  SEASON_DETAIL: (id: string) => `/seasons/${id}/`,
  ACTIVE_SEASON: '/seasons/active/',
  PARTNERS: '/partners/',
  PARTNER_DETAIL: (id: string) => `/partners/${id}/`,
  
  // Клубы
  CLUBS: '/clubs/',
  CLUB_DETAIL: (id: string) => `/clubs/${id}/`,
  CLUB_PLAYERS: (id: string) => `/clubs/${id}/players/`,
  CLUB_MATCHES: (id: string) => `/clubs/${id}/matches/`,
  COACHES: '/clubs/coaches/',
  CLUB_SEASONS: '/clubs/seasons/',
  TABLE: '/clubs/table/',
  CLUB_APPLICATIONS: '/clubs/applications/',
  
  // Матчи
  MATCHES: '/matches/',
  MATCH_DETAIL: (id: string | number) => `/matches/${id}/`,
  // Новые эндпоинты для событий
  MATCH_GOALS: (matchId: string | number) => `/matches/${matchId}/goals/`,
  MATCH_CARDS: (matchId: string | number) => `/matches/${matchId}/cards/`,
  MATCH_ASSISTS: (matchId: string | number) => `/matches/${matchId}/assists/`,
  MATCH_ADD_GOAL: (matchId: string | number) => `/matches/${matchId}/add_goal/`,
  MATCH_ADD_CARD: (matchId: string | number) => `/matches/${matchId}/add_card/`,
  MATCH_ADD_ASSIST: (matchId: string | number) => `/matches/${matchId}/add_assist/`,
  STADIUMS: '/matches/stadiums/',
  STADIUM_DETAIL: (id: string) => `/matches/stadiums/${id}/`,
  UPCOMING_MATCHES: '/matches/upcoming/',
  LATEST_MATCHES: '/matches/latest/',
  GOALS: '/matches/goals/',
  CARDS: '/matches/cards/',
  SUBSTITUTIONS: '/matches/substitutions/',
  
  // Игроки
  PLAYERS: '/players/',
  PLAYER_DETAIL: (id: string) => `/players/${id}/`,
  PLAYER_STATS: (id: string) => `/players/${id}/stats/`,
  TOP_SCORERS: '/players/top_scorers/',
  PLAYER_STATS_LIST: '/players/stats/',
  PLAYER_TRANSFERS: '/players/transfers/',
  PLAYER_TRANSFER_DETAIL: (id: string) => `/players/transfers/${id}/`,
  
  // Судьи
  REFEREES: '/referees/',
  REFEREES_DETAIL: (id: string) => `/referees/${id}/`,
  
  // Руководство
  MANAGEMENT: '/management/',
  MANAGEMENT_DETAIL: (id: string) => `/management/${id}/`,
  
  // Статистика
  SEASON_STATS: '/stats/seasons/',
  CLUB_STATS: '/stats/clubs/',
  
  // Медиа
  MEDIA: '/media/',
  MEDIA_DETAIL: (id: string) => `/media/${id}/`,
  MEDIA_BY_CATEGORY: '/media/by_category/',
} 