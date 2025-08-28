'use client'

interface AdminSidebarProps {
  activeSection: string
  onSectionChange: (section: any) => void
}

export function AdminSidebar({ activeSection, onSectionChange }: AdminSidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Панель управления', icon: '📊' },
    { id: 'clubs', label: 'Клубы', icon: '⚽' },
    { id: 'matches', label: 'Матчи', icon: '🏆' },
    { id: 'players', label: 'Игроки', icon: '👤' },
    { id: 'media', label: 'Медиа', icon: '📸' },
    { id: 'referees', label: 'Судьи', icon: '👨‍⚖️' },
    { id: 'management', label: 'Руководство', icon: '👔' },
    { id: 'stats', label: 'Статистика', icon: '📊' },
  ]

  return (
    <div className="w-64 bg-brand-darker min-h-screen p-4">
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white">KGFL Админ</h1>
      </div>
      
      <nav className="space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`w-full text-left p-3 rounded-lg transition-colors ${
              activeSection === item.id
                ? 'bg-brand-primary text-white'
                : 'text-white/70 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="mr-3">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
} 