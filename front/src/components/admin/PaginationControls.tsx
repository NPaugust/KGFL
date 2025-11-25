"use client"

import { clsx } from 'clsx'
import { useMemo } from 'react'

export const DEFAULT_PAGE_SIZE = 6

interface PaginationControlsProps {
  page: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  className?: string
}

export function PaginationControls({
  page,
  pageSize,
  totalItems,
  onPageChange,
  className,
}: PaginationControlsProps) {
  const { totalPages, startItem, endItem } = useMemo(() => {
    const totalPagesCalc = Math.max(1, Math.ceil(totalItems / pageSize))
    const currentPage = Math.min(Math.max(page, 1), totalPagesCalc)
    const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
    const end = Math.min(totalItems, currentPage * pageSize)

    return {
      totalPages: totalPagesCalc,
      startItem: start,
      endItem: end,
    }
  }, [totalItems, pageSize, page])

  // Показываем пагинацию только если элементов больше размера страницы
  if (totalItems <= pageSize || totalPages <= 1) {
    return null
  }

  const handlePrev = () => {
    if (page > 1) {
      onPageChange(page - 1)
    }
  }

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1)
    }
  }

  return (
    <div className={clsx('mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="text-sm text-white/70">
        Показаны {startItem}-{endItem} из {totalItems}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrev}
          disabled={page <= 1}
          className="btn btn-outline h-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Назад
        </button>
        <div className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-sm font-medium">
          Стр. {Math.min(page, totalPages)} из {totalPages}
        </div>
        <button
          type="button"
          onClick={handleNext}
          disabled={page >= totalPages}
          className="btn btn-outline h-10 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Вперёд
        </button>
      </div>
    </div>
  )
}


