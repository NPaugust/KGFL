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
    console.log('useAuthStore: Starting login process')
    set({ loginLoading: true })
    try {
      const response = await apiClient.login(username, password)
      console.log('useAuthStore: Login response received:', response)
      const { access_token, refresh_token, user } = response
      
      console.log('useAuthStore: Storing tokens in localStorage')
      localStorage.setItem('access_token', access_token)
      localStorage.setItem('refresh_token', refresh_token)
      
      console.log('useAuthStore: Setting user state')
      set({ user, isAuthenticated: true, loginLoading: false })
      console.log('useAuthStore: Login completed successfully')
    } catch (error) {
      console.error('useAuthStore: Login error:', error)
      set({ loginLoading: false })
      throw error
    }
  },

  logout: () => {
    console.log('useAuthStore: Logging out')
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    set({ user: null, isAuthenticated: false })
    console.log('useAuthStore: Logout completed')
  },

  checkAuth: async () => {
    console.log('useAuthStore: Checking authentication')
    const token = localStorage.getItem('access_token')
    console.log('useAuthStore: Token found:', token ? 'Yes' : 'No')
    
    if (!token) {
      console.log('useAuthStore: No token found, setting not authenticated')
      set({ isAuthenticated: false, user: null, loading: false })
      return
    }

    try {
      console.log('useAuthStore: Attempting to get user profile')
      const user = await apiClient.get<User>('/users/me/')
      console.log('useAuthStore: User profile received:', user)
      set({ user, isAuthenticated: true, loading: false })
      console.log('useAuthStore: Authentication check completed successfully')
    } catch (error) {
      console.error('useAuthStore: Authentication check failed:', error)
      get().logout()
      set({ loading: false })
      console.log('useAuthStore: Authentication check failed, logged out')
    }
  },
}))

// Автоматически проверяем авторизацию при инициализации
if (typeof window !== 'undefined') {
  console.log('useAuthStore: Initializing auth check')
  useAuthStore.getState().checkAuth()
} 