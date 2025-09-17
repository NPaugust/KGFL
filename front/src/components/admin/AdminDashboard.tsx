'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
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
import { TransfersManager } from './TransfersManager'
import { SeasonsManager } from './SeasonsManager'
import { DashboardOverview } from './DashboardOverview'
import { StadiumsManager } from './StadiumsManager'

export type AdminSection = 'dashboard' | 'clubs' | 'matches' | 'players' | 'media' | 'referees' | 'management' | 'stats' | 'partners' | 'transfers' | 'seasons' | 'guide'

export interface AdminSidebarProps {
  activeSection: AdminSection
  onSectionChange: (section: AdminSection) => void
}

export function AdminDashboard() {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard')

  const handleClose = () => {
    // Возвращаемся к дашборду при закрытии модальных окон
    setActiveSection('dashboard')
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardOverview onSectionChange={setActiveSection} />
      case 'guide':
        return <StadiumsManager />
      case 'clubs':
        return <ClubsManager />
      case 'matches':
        return <MatchesManager />
      case 'players':
        return <PlayersManager />
      case 'transfers':
        return <TransfersManager />
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
      case 'seasons':
        return <SeasonsManager />
      default:
        return <DashboardOverview onSectionChange={setActiveSection} />
    }
  }

  return (
    <div className="min-h-screen bg-brand-dark flex">
      <AdminSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 p-6 overflow-auto">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderSection()}
          </motion.div>
        </main>
      </div>
    </div>
  )
} 