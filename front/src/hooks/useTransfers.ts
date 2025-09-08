import { useState, useCallback } from 'react'
import { api } from '@/services/api'
import { PlayerTransfer } from '@/types'

interface UseTransfersReturn {
  transfers: PlayerTransfer[]
  loading: boolean
  error: string | null
  fetchTransfers: () => Promise<void>
  confirmTransfer: (id: string) => Promise<void>
  cancelTransfer: (id: string) => Promise<void>
  createTransfer: (data: Partial<PlayerTransfer>) => Promise<PlayerTransfer>
}

export const useTransfers = (): UseTransfersReturn => {
  const [transfers, setTransfers] = useState<PlayerTransfer[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTransfers = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.get('/players/transfers/')
      setTransfers((response as any).data.results || (response as any).data)
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка загрузки трансферов'
      setError(errorMessage)
      console.error('Ошибка загрузки трансферов:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const confirmTransfer = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await api.post(`/players/transfers/${id}/confirm/`)
      // Обновляем список трансферов после подтверждения
      await fetchTransfers()
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка подтверждения трансфера'
      setError(errorMessage)
      console.error('Ошибка подтверждения трансфера:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchTransfers])

  const cancelTransfer = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await api.post(`/players/transfers/${id}/cancel/`)
      // Обновляем список трансферов после отмены
      await fetchTransfers()
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка отмены трансфера'
      setError(errorMessage)
      console.error('Ошибка отмены трансфера:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchTransfers])

  const createTransfer = useCallback(async (data: Partial<PlayerTransfer>): Promise<PlayerTransfer> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.post('/players/transfers/', data)
      // Обновляем список трансферов после создания
      await fetchTransfers()
      return (response as any).data
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка создания трансфера'
      setError(errorMessage)
      console.error('Ошибка создания трансфера:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchTransfers])

  return {
    transfers,
    loading,
    error,
    fetchTransfers,
    confirmTransfer,
    cancelTransfer,
    createTransfer
  }
}