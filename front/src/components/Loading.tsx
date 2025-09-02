import { cn } from '@/utils'

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  text?: string
}

export function Loading({ size = 'md', className, text }: LoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div className="flex flex-col items-center gap-3">
        <svg
          className={cn("animate-spin text-brand-primary", sizeClasses[size])}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        {text && (
          <p className="text-white/70 text-sm">{text}</p>
        )}
      </div>
    </div>
  )
}

// Компонент для загрузки страницы
export function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <Loading size="xl" text="Загрузка..." />
    </div>
  )
}

// Компонент для загрузки секции
export function SectionLoading() {
  return (
    <div className="py-16">
      <Loading size="lg" text="Загрузка данных..." />
    </div>
  )
}

// Компонент для скелетона таблицы
export function TableSkeleton({ rows = 10 }: { rows?: number }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4">
        <div className="animate-pulse">
          {/* Header */}
          <div className="grid grid-cols-9 gap-4 mb-4">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="h-4 bg-white/10 rounded" />
            ))}
          </div>
          
          {/* Rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="grid grid-cols-9 gap-4 mb-3">
              {Array.from({ length: 9 }).map((_, j) => (
                <div key={j} className="h-4 bg-white/5 rounded" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Компонент для скелетона карточки
export function CardSkeleton() {
  return (
    <div className="card p-4">
      <div className="animate-pulse">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 bg-white/10 rounded" />
          <div className="flex-1">
            <div className="h-4 bg-white/10 rounded mb-2" />
            <div className="h-3 bg-white/5 rounded w-2/3" />
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-white/5 rounded" />
          <div className="h-3 bg-white/5 rounded w-4/5" />
        </div>
      </div>
    </div>
  )
}

// Компонент для скелетона списка
export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  )
} 