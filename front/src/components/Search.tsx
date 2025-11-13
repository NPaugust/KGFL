'use client'

import { useState, useEffect, useRef } from 'react'
import { cn } from '@/utils'

interface SearchProps {
  placeholder?: string
  onSearch: (query: string) => void
  className?: string
  debounceMs?: number
  initialValue?: string
  hideIcon?: boolean
  square?: boolean
}

export function Search({ 
  placeholder = "Поиск...", 
  onSearch, 
  className,
  debounceMs = 300,
  initialValue = "",
  hideIcon = false,
  square = false
}: SearchProps) {
  const [query, setQuery] = useState(initialValue)
  const [isFocused, setIsFocused] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Обновляем локальное состояние, если пришло новое initialValue
  useEffect(() => {
    setQuery(initialValue)
  }, [initialValue])

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      onSearch(query)
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [query, onSearch, debounceMs])

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className={cn(
            "w-full px-4 py-2 bg-white/5 border border-white/10",
            hideIcon ? "pl-3 pr-10" : "pl-10 pr-10",
            square ? "rounded-none" : "rounded-lg",
            "text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-brand-primary/50",
            "transition-all duration-200",
            isFocused && "border-white/20 bg-white/10"
          )}
        />
        
        {/* Search Icon */}
        {!hideIcon && (
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        )}

        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/50 hover:text-white transition-colors"
            aria-label="Очистить поиск"
          >
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// Компонент для поиска с выпадающими результатами
interface SearchWithResultsProps<T> {
  placeholder?: string
  items: T[]
  searchFields: (keyof T)[]
  onSelect: (item: T) => void
  renderItem: (item: T) => React.ReactNode
  className?: string
  maxResults?: number
}

export function SearchWithResults<T extends Record<string, any>>({
  placeholder = "Поиск...",
  items,
  searchFields,
  onSelect,
  renderItem,
  className,
  maxResults = 10
}: SearchWithResultsProps<T>) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [filteredItems, setFilteredItems] = useState<T[]>([])

  useEffect(() => {
    if (!query.trim()) {
      setFilteredItems([])
      return
    }

    const filtered = items
      .filter(item =>
        searchFields.some(field => {
          const value = item[field]
          return value && value.toString().toLowerCase().includes(query.toLowerCase())
        })
      )
      .slice(0, maxResults)

    setFilteredItems(filtered)
  }, [query, items, searchFields, maxResults])

  const handleSelect = (item: T) => {
    onSelect(item)
    setQuery('')
    setIsOpen(false)
  }

  return (
    <div className={cn("relative", className)}>
      <Search
        placeholder={placeholder}
        onSearch={setQuery}
        className="w-full"
      />
      
      {isOpen && filteredItems.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-brand-dark border border-white/10 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {filteredItems.map((item, index) => (
            <button
              key={index}
              onClick={() => handleSelect(item)}
              className="w-full px-4 py-2 text-left hover:bg-white/5 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              {renderItem(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 