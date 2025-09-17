'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)
  const { user, isAuthenticated } = useAuthStore()

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Скролл вниз и больше 100px
        setIsVisible(false)
      } else {
        // Скролл вверх
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <header className={`sticky top-0 z-50 border-b border-white/10 bg-brand-dark/70 backdrop-blur-xl transition-transform duration-300 ${
      isVisible ? 'translate-y-0' : '-translate-y-full'
    }`}>
      <div className="container-px flex h-24 items-center justify-between">
        <Link href="/" className="flex items-center gap-3 mr-8 md:mr-16" onClick={closeMobileMenu}>
          <Image src="/logotip.png" alt="KGFL" width={72} height={72} className="rounded" />
          <span className="text-2xl font-extrabold tracking-wide">KGFL</span>
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-7">
          <Link href="/" className="text-white/80 hover:text-white transition-colors">Главная</Link>
          <Link href="/table" className="text-white/80 hover:text-white transition-colors">Таблица</Link>
          <Link href="/clubs" className="text-white/80 hover:text-white transition-colors">Клубы</Link>
          <Link href="/stats" className="text-white/80 hover:text-white transition-colors">Статистика</Link>
          <Link href="/schedule" className="text-white/80 hover:text-white transition-colors">Расписание</Link>
          <Link href="/transfers" className="text-white/80 hover:text-white transition-colors">Трансферы</Link>
          <Link href="/referees" className="text-white/80 hover:text-white transition-colors">Судьи</Link>
          <Link href="/management" className="text-white/80 hover:text-white transition-colors">Руководство</Link>
          <Link href="/media" className="text-white/80 hover:text-white transition-colors">Медиа</Link>

        </nav>
        
        <div className="flex items-center gap-3 ml-4 md:ml-4">
          {isAuthenticated && (
            <div className="flex items-center gap-3">
              <span className="text-white/70 text-sm hidden sm:block">
                {user?.username}
              </span>
              <Link href="/admin" className="btn btn-primary hidden sm:inline-flex">Управление</Link>
            </div>
          )}
          
          {/* Mobile Menu Button */}
          <button
            onClick={toggleMobileMenu}
            className="md:hidden p-2 text-white/80 hover:text-white transition-colors"
            aria-label="Открыть меню"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-white/10 bg-brand-dark/95 backdrop-blur-xl">
          <nav className="container-px py-4 space-y-2">
            <Link 
              href="/" 
              className="block py-2 text-white/80 hover:text-white transition-colors"
              onClick={closeMobileMenu}
            >
              Главная
            </Link>
            <Link 
              href="/table" 
              className="block py-2 text-white/80 hover:text-white transition-colors"
              onClick={closeMobileMenu}
            >
              Таблица
            </Link>
            <Link 
              href="/clubs" 
              className="block py-2 text-white/80 hover:text-white transition-colors"
              onClick={closeMobileMenu}
            >
              Клубы
            </Link>
            <Link 
              href="/stats" 
              className="block py-2 text-white/80 hover:text-white transition-colors"
              onClick={closeMobileMenu}
            >
              Статистика
            </Link>
            <Link 
              href="/schedule" 
              className="block py-2 text-white/80 hover:text-white transition-colors"
              onClick={closeMobileMenu}
            >
              Расписание
            </Link>
            <Link 
              href="/referees" 
              className="block py-2 text-white/80 hover:text-white transition-colors"
              onClick={closeMobileMenu}
            >
              Судьи
            </Link>
            <Link 
              href="/management" 
              className="block py-2 text-white/80 hover:text-white transition-colors"
              onClick={closeMobileMenu}
            >
              Руководство
            </Link>
            <Link 
              href="/media" 
              className="block py-2 text-white/80 hover:text-white transition-colors"
              onClick={closeMobileMenu}
            >
              Медиа
            </Link>
            <Link 
              href="/transfers" 
              className="block py-2 text-white/80 hover:text-white transition-colors"
              onClick={closeMobileMenu}
            >
              Трансферы
            </Link>
            {isAuthenticated && (
              <Link 
                href="/admin" 
                className="block py-2 text-brand-primary hover:text-brand-primaryDark transition-colors font-semibold"
                onClick={closeMobileMenu}
              >
                Управление
              </Link>
            )}

          </nav>
        </div>
      )}
    </header>
  )
}


