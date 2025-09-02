'use client'

import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'

export function AdminHeader() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <header className="bg-brand-darker border-b border-white/10 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Панель управления</h2>
          <p className="text-sm text-white/60">
            Добро пожаловать, {user?.first_name} {user?.last_name}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/60">
            Роль: {user?.role === 'admin' ? 'Администратор' : user?.role}
          </span>
          <button
            onClick={handleLogout}
            className="btn btn-secondary text-sm"
          >
            Выйти
          </button>
        </div>
      </div>
    </header>
  )
} 