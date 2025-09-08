'use client'

import { useAuthStore } from '@/store/useAuthStore'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

export function AdminHeader() {
  const { user, logout } = useAuthStore()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
        <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="bg-brand-dark border-b border-white/10 p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Панель управления KGFL</h2>
            <p className="text-sm text-white/70">
              Добро пожаловать <span className="text-brand-primary font-medium">{user?.first_name} {user?.last_name}</span>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Роль пользователя */}
          <div className="px-3 py-2 bg-white/10 rounded-lg">
            <span className="text-sm text-white/80">
              {user?.role === 'admin' ? 'Администратор' : user?.role}
            </span>
          </div>

          {/* Кнопка выхода */}
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200"
          >
            Выйти
          </button>
        </div>
      </div>
    </motion.header>
  )
} 