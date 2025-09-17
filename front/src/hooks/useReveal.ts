"use client"
import { useEffect, useRef } from 'react'

export function useReveal() {
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // Добавляем класс reveal если его нет
    if (!element.classList.contains('reveal')) {
      element.classList.add('reveal')
    }

    // Проверяем, видим ли элемент сразу
    const checkVisibility = () => {
      const rect = element.getBoundingClientRect()
      const isVisible = rect.top < window.innerHeight * 0.9 && rect.bottom > 0
      
      if (isVisible) {
        // Небольшая задержка для плавности
        setTimeout(() => {
          element.classList.add('reveal-in')
        }, 50)
      }
    }

    // Проверяем видимость сразу и при изменении размера окна
    checkVisibility()
    window.addEventListener('resize', checkVisibility)
    window.addEventListener('scroll', checkVisibility)

    return () => {
      window.removeEventListener('resize', checkVisibility)
      window.removeEventListener('scroll', checkVisibility)
    }
  }, [])

  return elementRef
} 