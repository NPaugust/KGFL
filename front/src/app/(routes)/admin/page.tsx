'use client'

import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AdminDashboard } from '@/components/admin/AdminDashboard'

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  )
} 