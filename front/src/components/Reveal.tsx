"use client"
import { forwardRef, ElementType } from 'react'
import { useReveal } from '@/hooks/useReveal'

interface RevealProps {
  children: React.ReactNode
  className?: string
  delay?: number
  as?: ElementType
}

export const Reveal = forwardRef<HTMLElement, RevealProps>(
  ({ children, className = '', delay = 0, as: Component = 'div', ...props }, ref) => {
    const revealRef = useReveal()
    
    const combinedRef = (node: HTMLElement) => {
      // Обновляем оба ref
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
      revealRef.current = node
    }

    const style = delay > 0 ? { transitionDelay: `${delay}ms` } : {}

    return (
      <Component
        ref={combinedRef}
        className={`reveal ${className}`}
        style={style}
        {...props}
      >
        {children}
      </Component>
    )
  }
)

Reveal.displayName = 'Reveal' 