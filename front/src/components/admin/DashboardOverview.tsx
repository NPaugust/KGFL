"use client"

type AdminSection = 'dashboard' | 'clubs' | 'matches' | 'players' | 'media' | 'referees' | 'management' | 'stats' | 'partners' | 'transfers' | 'seasons'

interface DashboardOverviewProps {
  onSectionChange: (section: AdminSection) => void
}

export function DashboardOverview({ onSectionChange }: DashboardOverviewProps) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Панель управления KGFL</h1>
      <p className="text-white/70 mb-8">Управление футбольной лигой, матчами, клубами и игроками</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => onSectionChange('clubs')}>
          <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
            <span className="text-brand-primary font-bold text-xl">⚽</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Клубы</h3>
          <p className="text-white/70 text-sm">Добавление, редактирование и удаление футбольных клубов</p>
        </div>
        
        <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => onSectionChange('matches')}>
          <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
            <span className="text-brand-primary font-bold text-xl">🏟️</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Матчи</h3>
          <p className="text-white/70 text-sm">Создание матчей, ввод результатов в реальном времени</p>
        </div>
        
        <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => onSectionChange('players')}>
          <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
            <span className="text-brand-primary font-bold text-xl">👤</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Игроки</h3>
          <p className="text-white/70 text-sm">Управление игроками, статистикой и переходами</p>
        </div>
        
        <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => onSectionChange('media')}>
          <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
            <span className="text-brand-primary font-bold text-xl">📰</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Медиа</h3>
          <p className="text-white/70 text-sm">Управление фотографиями и медиа файлами</p>
        </div>
        
        <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => onSectionChange('referees')}>
          <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
            <span className="text-brand-primary font-bold text-xl">👨‍⚖️</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Судьи</h3>
          <p className="text-white/70 text-sm">Управление судьями и их информацией</p>
        </div>
        
        <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => onSectionChange('management')}>
          <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
            <span className="text-brand-primary font-bold text-xl">👔</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Руководство</h3>
          <p className="text-white/70 text-sm">Управление руководством лиги</p>
        </div>

        <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => onSectionChange('seasons')}>
          <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
            <span className="text-brand-primary font-bold text-xl">📅</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Сезоны</h3>
          <p className="text-white/70 text-sm">Управление сезонами лиги</p>
        </div>

        <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => onSectionChange('transfers')}>
          <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
            <span className="text-brand-primary font-bold text-xl">🔄</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Трансферы</h3>
          <p className="text-white/70 text-sm">Управление переходами игроков</p>
        </div>
        
        <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => onSectionChange('partners')}>
          <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
            <span className="text-brand-primary font-bold text-xl">🤝</span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Партнеры</h3>
          <p className="text-white/70 text-sm">Управление партнерами и спонсорами лиги</p>
        </div>
      </div>
    </div>
  )
}
