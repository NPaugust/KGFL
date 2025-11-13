'use client'

import React, { useState, useEffect } from 'react'
import { useMatchEvents } from '@/hooks/useMatchEvents'
import { Goal, Card, Substitution, Match } from '@/types'
import { formatDate, formatTime } from '@/utils'
import { motion, AnimatePresence } from 'framer-motion'

interface MatchEventsManagerProps {
  match: Match
  onClose: () => void
}

export const MatchEventsManager: React.FC<MatchEventsManagerProps> = ({ match, onClose }) => {
  const { 
    goals, 
    cards, 
    substitutions, 
    loading, 
    error, 
    fetchMatchEvents, 
    addGoal, 
    addCard, 
    addSubstitution,
    deleteGoal,
    deleteCard,
    deleteSubstitution
  } = useMatchEvents()
  
  const [activeTab, setActiveTab] = useState<'goals' | 'cards' | 'substitutions'>('goals')
  const [showAddModal, setShowAddModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (match.id) {
      fetchMatchEvents(match.id.toString())
    }
  }, [match.id, fetchMatchEvents])

  const handleAddGoal = async (data: Partial<Goal>) => {
    setActionLoading('add-goal')
    try {
      await addGoal(match.id.toString(), data)
      setShowAddModal(false)
    } catch (error) {
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddCard = async (data: Partial<Card>) => {
    setActionLoading('add-card')
    try {
      await addCard(match.id.toString(), data)
      setShowAddModal(false)
    } catch (error) {
    } finally {
      setActionLoading(null)
    }
  }

  const handleAddSubstitution = async (data: Partial<Substitution>) => {
    setActionLoading('add-substitution')
    try {
      await addSubstitution(match.id.toString(), data)
      setShowAddModal(false)
    } catch (error) {
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteGoal = async (id: string) => {
    setActionLoading(id)
    try {
      await deleteGoal(id)
    } catch (error) {
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteCard = async (id: string) => {
    setActionLoading(id)
    try {
      await deleteCard(id)
    } catch (error) {
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteSubstitution = async (id: string) => {
    setActionLoading(id)
    try {
      await deleteSubstitution(id)
    } catch (error) {
    } finally {
      setActionLoading(null)
    }
  }

  const getCardColor = (cardType: string) => {
    switch (cardType) {
      case 'yellow':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'red':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getCardText = (cardType: string) => {
    switch (cardType) {
      case 'yellow':
        return 'Желтая карточка'
      case 'red':
        return 'Красная карточка'
      default:
        return 'Неизвестно'
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white/80 mt-4 text-center">Загрузка событий матча...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 max-w-md">
          <div className="text-red-400 text-center mb-4">
            <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-semibold">Ошибка загрузки</p>
          </div>
          <p className="text-white/80 text-center mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => fetchMatchEvents(match.id.toString())}
              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-4 py-2 rounded-lg border border-blue-500/30 transition-all duration-200"
            >
              Повторить
            </button>
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-4 py-2 rounded-lg border border-gray-500/30 transition-all duration-200"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-6xl max-h-[90vh] overflow-hidden"
      >
        {/* Заголовок */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <h2 className="text-2xl font-bold text-white">События матча</h2>
            <p className="text-white/60 mt-1">
              {match.home_team_name} vs {match.away_team_name} - {formatDate(match.date)} {match.time ? formatTime(match.time) : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
          >
            <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Вкладки */}
        <div className="flex border-b border-white/10">
          {[
            { key: 'goals', label: 'Голы', count: goals.length },
            { key: 'cards', label: 'Карточки', count: cards.length },
            { key: 'substitutions', label: 'Замены', count: substitutions.length }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-6 py-4 font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? 'text-white border-b-2 border-blue-400 bg-blue-500/10'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Содержимое */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Кнопка добавления */}
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg border border-blue-500/30 transition-all duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Добавить {activeTab === 'goals' ? 'гол' : activeTab === 'cards' ? 'карточку' : 'замену'}
            </button>
          </div>

          {/* Список событий */}
          <div className="space-y-4">
            {activeTab === 'goals' && (
              <>
                {goals.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-white/60">Голы не найдены</p>
                  </div>
                ) : (
                  goals.map((goal) => (
                    <motion.div
                      key={goal.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">{goal.player_name}</p>
                          <p className="text-white/60 text-sm">
                            {goal.minute}&apos; - {goal.team_name}
                            {goal.assist_player_name && ` (ассист: ${goal.assist_player_name})`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteGoal(goal.id)}
                        disabled={actionLoading === goal.id}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors duration-200 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </motion.div>
                  ))
                )}
              </>
            )}

            {activeTab === 'cards' && (
              <>
                {cards.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-white/60">Карточки не найдены</p>
                  </div>
                ) : (
                  cards.map((card) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getCardColor(card.card_type)}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">{card.player_name}</p>
                          <p className="text-white/60 text-sm">
                            {card.minute}&apos; - {card.team_name} - {getCardText(card.card_type)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCard(card.id)}
                        disabled={actionLoading === card.id}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors duration-200 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </motion.div>
                  ))
                )}
              </>
            )}

            {activeTab === 'substitutions' && (
              <>
                {substitutions.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <p className="text-white/60">Замены не найдены</p>
                  </div>
                ) : (
                  substitutions.map((substitution) => (
                    <motion.div
                      key={substitution.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-white font-medium">
                            {substitution.player_out_name} → {substitution.player_in_name}
                          </p>
                          <p className="text-white/60 text-sm">
                            {substitution.minute}&apos; - {substitution.team_name}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteSubstitution(substitution.id)}
                        disabled={actionLoading === substitution.id}
                        className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors duration-200 disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </motion.div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* Модальное окно добавления события */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-60 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 w-full max-w-md"
            >
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white">
                    Добавить {activeTab === 'goals' ? 'гол' : activeTab === 'cards' ? 'карточку' : 'замену'}
                  </h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-white/80 mb-2">Форма добавления</h4>
                  <p className="text-white/60 mb-6">
                    Форма для добавления {activeTab === 'goals' ? 'гола' : activeTab === 'cards' ? 'карточки' : 'замены'} будет реализована в следующей итерации
                  </p>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg border border-blue-500/30 transition-all duration-200"
                  >
                    Понятно
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}