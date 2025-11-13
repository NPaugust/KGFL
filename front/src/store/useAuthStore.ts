import { create } from 'zustand'
import { apiClient } from '@/services/api'

interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  role?: string
  is_superuser?: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  loginLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true, // Начинаем с loading: true
  loginLoading: false,

  login: async (username: string, password: string) => {
    set({ loginLoading: true })
    try {
      const response = await apiClient.login(username, password)
      const { access_token, refresh_token, user } = response
      
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      
      set({ user, isAuthenticated: true, loginLoading: false })
    } catch (error) {
      set({ loginLoading: false })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('access_token')
    
    if (!token) {
      set({ isAuthenticated: false, user: null, loading: false })
      return
    }

    try {
      const user = await apiClient.get<User>('/users/me/')
      set({ user, isAuthenticated: true, loading: false })
    } catch (error) {
      get().logout()
      set({ loading: false })
    }
  },
}))

// Автоматически проверяем авторизацию при инициализации
if (typeof window !== 'undefined') {
  useAuthStore.getState().checkAuth()
} 