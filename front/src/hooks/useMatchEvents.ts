import { useState, useCallback } from 'react'
import { api } from '@/services/api'
import { Goal, Card, Substitution } from '@/types'

interface UseMatchEventsReturn {
  goals: Goal[]
  cards: Card[]
  substitutions: Substitution[]
  loading: boolean
  error: string | null
  fetchMatchEvents: (matchId: string) => Promise<void>
  addGoal: (matchId: string, data: Partial<Goal>) => Promise<Goal>
  addCard: (matchId: string, data: Partial<Card>) => Promise<Card>
  addSubstitution: (matchId: string, data: Partial<Substitution>) => Promise<Substitution>
  updateGoal: (id: string, data: Partial<Goal>) => Promise<Goal>
  updateCard: (id: string, data: Partial<Card>) => Promise<Card>
  updateSubstitution: (id: string, data: Partial<Substitution>) => Promise<Substitution>
  deleteGoal: (id: string) => Promise<void>
  deleteCard: (id: string) => Promise<void>
  deleteSubstitution: (id: string) => Promise<void>
}

export const useMatchEvents = (): UseMatchEventsReturn => {
  const [goals, setGoals] = useState<Goal[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [substitutions, setSubstitutions] = useState<Substitution[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMatchEvents = useCallback(async (matchId: string) => {
    setLoading(true)
    setError(null)
    
    try {
      const [goalsResponse, cardsResponse, substitutionsResponse] = await Promise.all([
        api.get(`/matches/${matchId}/goals/`),
        api.get(`/matches/${matchId}/cards/`),
        api.get(`/matches/${matchId}/substitutions/`)
      ])
      
      setGoals((goalsResponse as any).data.results || (goalsResponse as any).data)
      setCards((cardsResponse as any).data.results || (cardsResponse as any).data)
      setSubstitutions((substitutionsResponse as any).data.results || (substitutionsResponse as any).data)
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка загрузки событий матча'
      setError(errorMessage)
      console.error('Ошибка загрузки событий матча:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const addGoal = useCallback(async (matchId: string, data: Partial<Goal>): Promise<Goal> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.post(`/matches/${matchId}/add_goal/`, data)
      // Обновляем список голов
      await fetchMatchEvents(matchId)
      return (response as any).data.goal
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка добавления гола'
      setError(errorMessage)
      console.error('Ошибка добавления гола:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchMatchEvents])

  const addCard = useCallback(async (matchId: string, data: Partial<Card>): Promise<Card> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.post(`/matches/${matchId}/add_card/`, data)
      // Обновляем список карточек
      await fetchMatchEvents(matchId)
      return (response as any).data.card
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка добавления карточки'
      setError(errorMessage)
      console.error('Ошибка добавления карточки:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchMatchEvents])

  const addSubstitution = useCallback(async (matchId: string, data: Partial<Substitution>): Promise<Substitution> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.post(`/matches/${matchId}/add_substitution/`, data)
      // Обновляем список замен
      await fetchMatchEvents(matchId)
      return (response as any).data.substitution
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка добавления замены'
      setError(errorMessage)
      console.error('Ошибка добавления замены:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [fetchMatchEvents])

  const updateGoal = useCallback(async (id: string, data: Partial<Goal>): Promise<Goal> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.patch(`/matches/goals/${id}/`, data)
      // Обновляем список голов
      const goal = goals.find(g => g.id === id)
      if (goal) {
        await fetchMatchEvents(goal.match.toString())
      }
      return (response as any).data
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка обновления гола'
      setError(errorMessage)
      console.error('Ошибка обновления гола:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [goals, fetchMatchEvents])

  const updateCard = useCallback(async (id: string, data: Partial<Card>): Promise<Card> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.patch(`/matches/cards/${id}/`, data)
      // Обновляем список карточек
      const card = cards.find(c => c.id === id)
      if (card) {
        await fetchMatchEvents(card.match.toString())
      }
      return (response as any).data
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка обновления карточки'
      setError(errorMessage)
      console.error('Ошибка обновления карточки:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [cards, fetchMatchEvents])

  const updateSubstitution = useCallback(async (id: string, data: Partial<Substitution>): Promise<Substitution> => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await api.patch(`/matches/substitutions/${id}/`, data)
      // Обновляем список замен
      const substitution = substitutions.find(s => s.id === id)
      if (substitution) {
        await fetchMatchEvents(substitution.match.toString())
      }
      return (response as any).data
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка обновления замены'
      setError(errorMessage)
      console.error('Ошибка обновления замены:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [substitutions, fetchMatchEvents])

  const deleteGoal = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await api.delete(`/matches/goals/${id}/`)
      // Обновляем список голов
      const goal = goals.find(g => g.id === id)
      if (goal) {
        await fetchMatchEvents(goal.match.toString())
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка удаления гола'
      setError(errorMessage)
      console.error('Ошибка удаления гола:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [goals, fetchMatchEvents])

  const deleteCard = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await api.delete(`/matches/cards/${id}/`)
      // Обновляем список карточек
      const card = cards.find(c => c.id === id)
      if (card) {
        await fetchMatchEvents(card.match.toString())
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка удаления карточки'
      setError(errorMessage)
      console.error('Ошибка удаления карточки:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [cards, fetchMatchEvents])

  const deleteSubstitution = useCallback(async (id: string) => {
    setLoading(true)
    setError(null)
    
    try {
      await api.delete(`/matches/substitutions/${id}/`)
      // Обновляем список замен
      const substitution = substitutions.find(s => s.id === id)
      if (substitution) {
        await fetchMatchEvents(substitution.match.toString())
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Ошибка удаления замены'
      setError(errorMessage)
      console.error('Ошибка удаления замены:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [substitutions, fetchMatchEvents])

  return {
    goals,
    cards,
    substitutions,
    loading,
    error,
    fetchMatchEvents,
    addGoal,
    addCard,
    addSubstitution,
    updateGoal,
    updateCard,
    updateSubstitution,
    deleteGoal,
    deleteCard,
    deleteSubstitution
  }
}