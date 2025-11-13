"use client"

import { motion } from 'framer-motion'

type AdminSection = 'dashboard' | 'clubs' | 'matches' | 'players' | 'media' | 'referees' | 'management' | 'stats' | 'partners' | 'transfers' | 'seasons'

interface DashboardOverviewProps {
  onSectionChange: (section: AdminSection) => void
}

export function DashboardOverview({ onSectionChange }: DashboardOverviewProps) {
  const sections = [
    { id: 'clubs', title: 'Клубы', description: 'Управление футбольными клубами', color: 'from-blue-500 to-blue-600' },
    { id: 'matches', title: 'Матчи', description: 'Расписание и результаты матчей', color: 'from-green-500 to-green-600' },
    { id: 'players', title: 'Игроки', description: 'База данных игроков', color: 'from-purple-500 to-purple-600' },
    { id: 'transfers', title: 'Трансферы', description: 'Переходы игроков между клубами', color: 'from-orange-500 to-orange-600' },
    { id: 'referees', title: 'Судьи', description: 'Судейский состав лиги', color: 'from-red-500 to-red-600' },
    { id: 'management', title: 'Руководство', description: 'Администрация лиги', color: 'from-indigo-500 to-indigo-600' },
    { id: 'media', title: 'Медиа', description: 'Фотографии', color: 'from-pink-500 to-pink-600' },
    { id: 'partners', title: 'Партнеры', description: 'Спонсоры и партнеры', color: 'from-teal-500 to-teal-600' },
    { id: 'seasons', title: 'Сезоны', description: 'Управление сезонами', color: 'from-cyan-500 to-cyan-600' },
  ]

  return (
    <div className="p-6">



      {/* Быстрые действия */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mb-8"
      >
        <h2 className="text-xl font-semibold text-white mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((section, index) => (
                                    <motion.div
                          key={section.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                          onClick={() => onSectionChange(section.id as any)}
                          className="bg-white/5 rounded-xl border border-white/10 p-6 cursor-pointer hover:bg-white/10 transition-all duration-200 group"
                        >
              <div className={`w-12 h-12 bg-brand-primary rounded-lg mb-4 flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                <span className="text-white font-bold text-lg">
                  {section.title.charAt(0)}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{section.title}</h3>
              <p className="text-white/70 text-sm">{section.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

    </div>
  )
}
