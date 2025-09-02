'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="py-4 px-6 bg-gradient-to-r from-brand-primary/20 via-red-500/20 to-orange-500/20 rounded-lg mb-6">
      <nav className="flex items-center space-x-2 text-sm">
        <Link 
          href="/" 
          className="flex items-center text-white/70 hover:text-white transition-colors"
        >
          <Home className="w-4 h-4 mr-1" />
          Главная
        </Link>
        
        {items.map((item, index) => (
          <div key={index} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-white/50 mx-2" />
            {item.href ? (
              <Link 
                href={item.href}
                className="text-white/70 hover:text-white transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-white font-medium">{item.label}</span>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
} 