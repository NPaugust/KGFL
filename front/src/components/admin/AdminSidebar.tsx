'use client'

import { AdminSidebarProps } from './AdminDashboard'

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Дашборд', icon: '📊' },
    { id: 'clubs', label: 'Клубы', icon: '⚽' },
    { id: 'players', label: 'Игроки', icon: '👤' },
    { id: 'matches', label: 'Матчи', icon: '🏟️' },
    { id: 'referees', label: 'Судьи', icon: '👨‍⚖️' },
    { id: 'management', label: 'Руководство', icon: '👔' },
    { id: 'media', label: 'Медиа', icon: '📰' },
    { id: 'partners', label: 'Партнеры', icon: '🤝' },
    { id: 'transfers', label: 'Трансферы', icon: '🔄' },
    { id: 'seasons', label: 'Сезоны', icon: '📅' },
  ]

  return (
    <div className="w-64 bg-brand-dark border-r border-white/10 p-6">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white">KGFL Админ</h2>
      </div>
      
      <nav>
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onSectionChange(item.id as any)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  activeSection === item.id
                    ? 'bg-brand-primary text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
} 