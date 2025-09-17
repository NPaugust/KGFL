'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { login, loginLoading, isAuthenticated } = useAuthStore()
  const router = useRouter()

  // Если пользователь уже авторизован, перенаправляем в админ-панель
  if (isAuthenticated) {
    router.push('/admin')
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Проверяем, что поля не пустые
    if (!username.trim() || !password.trim()) {
      setError('Пожалуйста, заполните все поля')
      return
    }

    setError('')
    setIsSubmitting(true)

    try {
      await login(username, password)
      // Небольшая задержка для лучшего UX
      setTimeout(() => {
        router.push('/admin')
      }, 500)
    } catch (err) {
      console.error('Login error:', err)
      setError('Неверные учетные данные')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Вход в систему</h1>
        
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Имя пользователя</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loginLoading && !isSubmitting) {
                  e.preventDefault()
                  handleSubmit(e as any)
                }
              }}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-brand-primary"
              placeholder="Введите имя пользователя"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !loginLoading && !isSubmitting) {
                  e.preventDefault()
                  handleSubmit(e as any)
                }
              }}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded focus:outline-none focus:border-brand-primary"
              placeholder="Введите пароль"
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            disabled={loginLoading || isSubmitting}
            className="w-full btn btn-primary py-3"
          >
            {loginLoading || isSubmitting ? 'Вход...' : 'Войти'}
          </button>
        </form>


      </div>
    </div>
  )
} 