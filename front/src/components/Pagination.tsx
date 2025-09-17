'use client'

import { cn } from '@/utils'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
  showInfo?: boolean
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  className,
  showInfo = false 
}: PaginationProps) {
  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const delta = 2
    const range = []
    const rangeWithDots = []

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i)
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  const visiblePages = getVisiblePages()

  return (
    <div className={cn("flex items-center justify-between", className)}>
      {showInfo && (
        <div className="text-sm text-white/70">
          Страница {currentPage} из {totalPages}
        </div>
      )}
      
      <div className="flex items-center gap-1">
        {/* Previous Button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            currentPage === 1
              ? "text-white/30"
              : "text-white/70 hover:text-white hover:bg-white/10"
          )}
          aria-label="Предыдущая страница"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Page Numbers */}
        {visiblePages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && onPageChange(page)}
            disabled={typeof page !== 'number'}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-lg transition-colors min-w-[40px]",
              typeof page === 'number'
                ? page === currentPage
                  ? "bg-brand-primary text-white"
                  : "text-white/70 hover:text-white hover:bg-white/10"
                : "text-white/30 cursor-default"
            )}
          >
            {page}
          </button>
        ))}

        {/* Next Button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={cn(
            "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            currentPage === totalPages
              ? "text-white/30"
              : "text-white/70 hover:text-white hover:bg-white/10"
          )}
          aria-label="Следующая страница"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// Компонент для простой пагинации с кнопками "Загрузить еще"
interface LoadMoreProps {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  className?: string
}

export function LoadMore({ hasMore, isLoading, onLoadMore, className }: LoadMoreProps) {
  if (!hasMore) return null

  return (
    <div className={cn("flex justify-center", className)}>
      <button
        onClick={onLoadMore}
        disabled={isLoading}
        className={cn(
          "btn btn-outline px-6 py-3",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Загрузка...
          </div>
        ) : (
          "Загрузить еще"
        )}
      </button>
    </div>
  )
} 