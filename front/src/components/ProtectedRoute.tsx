'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/useAuthStore'
import { Loading } from '@/components/Loading'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, isAuthenticated, loading, checkAuth } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, loading, router])

  if (loading) {
    return <Loading />
  }

  if (!isAuthenticated) {
    return null
  }

        if (requiredRole && user?.role !== requiredRole && !user?.is_superuser) {
        console.log('User role:', user?.role, 'Required role:', requiredRole, 'Is superuser:', user?.is_superuser)
        return (
          <div className="min-h-screen flex items-center justify-center bg-brand-dark">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Доступ запрещен</h1>
              <p className="text-white/70">У вас нет прав для доступа к этой странице</p>
            </div>
          </div>
        )
      }

  return <>{children}</>
} 