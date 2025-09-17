"use client"
import React, { useState, useRef, useEffect } from 'react'

interface PopoverProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Popover({ open, onOpenChange, children }: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen
  
  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }

  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { 
            isOpen, 
            onOpenChange: handleOpenChange 
          } as any)
        }
        return child
      })}
    </div>
  )
}

interface PopoverTriggerProps {
  asChild?: boolean
  children: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export const PopoverTrigger = React.forwardRef<HTMLButtonElement, PopoverTriggerProps>(
  ({ asChild, children, isOpen, onOpenChange, ...props }, ref) => {
    const handleClick = () => {
      onOpenChange?.(!isOpen)
    }

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        onClick: handleClick,
      } as any)
    }

    return (
      <button ref={ref} onClick={handleClick} {...props}>
        {children}
      </button>
    )
  }
)

PopoverTrigger.displayName = "PopoverTrigger"

interface PopoverContentProps {
  className?: string
  children: React.ReactNode
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export const PopoverContent = React.forwardRef<HTMLDivElement, PopoverContentProps>(
  ({ className = '', children, isOpen, onOpenChange, ...props }, ref) => {
    const contentRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
          onOpenChange?.(false)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen, onOpenChange])

    if (!isOpen) return null

    return (
      <div
        ref={contentRef}
        className={`absolute z-50 mt-2 ${className}`}
        {...props}
      >
        {children}
      </div>
    )
  }
)

PopoverContent.displayName = "PopoverContent"
