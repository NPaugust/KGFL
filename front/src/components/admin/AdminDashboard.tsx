'use client'

import { useState } from 'react'
import { AdminSidebar } from './AdminSidebar'
import { AdminHeader } from './AdminHeader'
import { ClubsManager } from './ClubsManager'
import { MatchesManager } from './MatchesManager'
import { PlayersManager } from './PlayersManager'
import { MediaManager } from './MediaManager'
import { RefereesManager } from './RefereesManager'
import { ManagementManager } from './ManagementManager'
import { StatsManager } from './StatsManager'
import { PartnersManager } from './PartnersManager'

type AdminSection = 'dashboard' | 'clubs' | 'matches' | 'players' | 'media' | 'referees' | 'management' | 'stats' | 'partners'

export function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')

  const renderSection = () => {
    switch (activeSection) {
      case 'clubs':
        return <ClubsManager />
      case 'matches':
        return <MatchesManager />
      case 'players':
        return <PlayersManager />
      case 'media':
        return <MediaManager />
      case 'referees':
        return <RefereesManager />
      case 'management':
        return <ManagementManager />
      case 'stats':
        return <StatsManager />
      case 'partners':
        return <PartnersManager />
      default:
        return (
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Панель управления KGFL</h1>
            <p className="text-white/70 mb-8">Управление футбольной лигой, матчами, клубами и игроками</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setActiveSection('clubs')}>
                <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-brand-primary font-bold text-xl">К</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Клубы</h3>
                <p className="text-white/70 text-sm">Добавление, редактирование и удаление футбольных клубов</p>
              </div>
              
              <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setActiveSection('matches')}>
                <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-brand-primary font-bold text-xl">М</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Матчи</h3>
                <p className="text-white/70 text-sm">Создание матчей, ввод результатов в реальном времени</p>
              </div>
              
              <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setActiveSection('players')}>
                <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-brand-primary font-bold text-xl">И</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Игроки</h3>
                <p className="text-white/70 text-sm">Управление игроками, статистикой и переходами</p>
              </div>
              
              <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setActiveSection('media')}>
                <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-brand-primary font-bold text-xl">Ф</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Медиа</h3>
                <p className="text-white/70 text-sm">Управление фотографиями и медиа файлами</p>
              </div>
              
              <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setActiveSection('referees')}>
                <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-brand-primary font-bold text-xl">С</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Судьи</h3>
                <p className="text-white/70 text-sm">Управление судьями и их информацией</p>
              </div>
              
              <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setActiveSection('management')}>
                <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-brand-primary font-bold text-xl">Р</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Руководство</h3>
                <p className="text-white/70 text-sm">Управление руководством лиги</p>
              </div>
              
              <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setActiveSection('stats')}>
                <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-brand-primary font-bold text-xl">С</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Статистика</h3>
                <p className="text-white/70 text-sm">Управление статистикой игроков</p>
              </div>
              
              <div className="card p-6 cursor-pointer hover:bg-white/10 transition-colors" onClick={() => setActiveSection('partners')}>
                <div className="w-12 h-12 bg-brand-primary/20 rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-brand-primary font-bold text-xl">П</span>
                </div>
                <h3 className="text-lg font-semibold mb-2">Партнеры лиги</h3>
                <p className="text-white/70 text-sm">Управление партнерами и спонсорами лиги</p>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-brand-primary/10 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Быстрые действия</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded">
                  <div className="w-8 h-8 bg-brand-primary/20 rounded flex items-center justify-center">
                    <span className="text-brand-primary font-bold text-sm">К</span>
                  </div>
                  <div>
                    <p className="font-medium">Добавить новый клуб</p>
                    <p className="text-sm text-white/60">Создать новый футбольный клуб в лиге</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded">
                  <div className="w-8 h-8 bg-brand-primary/20 rounded flex items-center justify-center">
                    <span className="text-brand-primary font-bold text-sm">М</span>
                  </div>
                  <div>
                    <p className="font-medium">Создать матч</p>
                    <p className="text-sm text-white/60">Запланировать новый матч</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded">
                  <div className="w-8 h-8 bg-brand-primary/20 rounded flex items-center justify-center">
                    <span className="text-brand-primary font-bold text-sm">И</span>
                  </div>
                  <div>
                    <p className="font-medium">Добавить игрока</p>
                    <p className="text-sm text-white/60">Зарегистрировать нового игрока</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded">
                  <div className="w-8 h-8 bg-brand-primary/20 rounded flex items-center justify-center">
                    <span className="text-brand-primary font-bold text-sm">Ф</span>
                  </div>
                  <div>
                    <p className="font-medium">Добавить фото</p>
                    <p className="text-sm text-white/60">Загрузить новое изображение</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded">
                  <div className="w-8 h-8 bg-brand-primary/20 rounded flex items-center justify-center">
                    <span className="text-brand-primary font-bold text-sm">С</span>
                  </div>
                  <div>
                    <p className="font-medium">Добавить судью</p>
                    <p className="text-sm text-white/60">Зарегистрировать нового судью</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded">
                  <div className="w-8 h-8 bg-brand-primary/20 rounded flex items-center justify-center">
                    <span className="text-brand-primary font-bold text-sm">Р</span>
                  </div>
                  <div>
                    <p className="font-medium">Добавить сотрудника</p>
                    <p className="text-sm text-white/60">Добавить в руководство</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded">
                  <div className="w-8 h-8 bg-brand-primary/20 rounded flex items-center justify-center">
                    <span className="text-brand-primary font-bold text-sm">С</span>
                  </div>
                  <div>
                    <p className="font-medium">Редактировать статистику</p>
                    <p className="text-sm text-white/60">Изменить данные игроков</p>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1">
          {renderSection()}
        </main>
      </div>
    </div>
  )
} 