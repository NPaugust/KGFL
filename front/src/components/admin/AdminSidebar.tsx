'use client'

import { AdminSidebarProps } from './AdminDashboard'
import { motion } from 'framer-motion'

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', description: 'Обзор системы' },
    { id: 'clubs', label: 'Клубы', description: 'Управление клубами' },
    { id: 'players', label: 'Игроки', description: 'База игроков' },
    { id: 'matches', label: 'Матчи', description: 'Расписание и результаты' },
    { id: 'referees', label: 'Судьи', description: 'Судейский состав' },
    { id: 'management', label: 'Руководство', description: 'Администрация лиги' },
    { id: 'media', label: 'Медиа', description: 'Новости и фото' },
    { id: 'partners', label: 'Партнеры', description: 'Спонсоры и партнеры' },
    { id: 'transfers', label: 'Трансферы', description: 'Переходы игроков' },
    { id: 'seasons', label: 'Сезоны', description: 'Управление сезонами' },
    { id: 'guide', label: 'Справка', description: 'Документация' },
  ]

  return (
    <motion.div 
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="w-72 bg-brand-dark border-r border-white/10 p-6"
    >
      {/* Заголовок */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div>
            <h2 className="text-xl font-bold text-white">KGFL Админ</h2>
            <p className="text-white/60 text-sm">Панель управления</p>
          </div>
        </div>
      </div>
      
      {/* Навигация */}
      <nav>
        <ul className="space-y-1">
          {menuItems.map((item, index) => (
            <motion.li 
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
                                        <button
                            onClick={() => onSectionChange(item.id as any)}
                            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                              activeSection === item.id
                                ? 'bg-brand-primary text-white'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-current opacity-60 group-hover:opacity-100 transition-opacity duration-200"></div>
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className={`text-xs ${
                      activeSection === item.id ? 'text-white/80' : 'text-white/50'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </div>
                
                {/* Активный индикатор */}
                {activeSection === item.id && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="absolute right-0 top-0 bottom-0 w-1 bg-white rounded-l-full"
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </button>
            </motion.li>
          ))}
        </ul>
      </nav>

    </motion.div>
  )
} 