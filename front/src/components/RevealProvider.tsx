"use client"
import { useEffect, useRef } from 'react'

export function RevealProvider({ children }: { children: React.ReactNode }) {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const observedElementsRef = useRef<Set<Element>>(new Set())

  useEffect(() => {
    // Создаем observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement
          if (entry.isIntersecting) {
            el.classList.add('reveal-in')
          } else {
            // Снимаем класс при уходе из вьюпорта для повторной анимации
            // Проверяем, что элемент еще в DOM перед операцией
            if (el.isConnected) {
              el.classList.remove('reveal-in')
            }
          }
        })
      },
      { 
        threshold: 0.1, 
        rootMargin: '0px 0px -10% 0px' 
      }
    )

    // Функция для наблюдения за элементами
    const observeElements = () => {
      const elements = Array.from(document.querySelectorAll('.reveal')) as HTMLElement[]
      
      elements.forEach((el) => {
        // Проверяем, что элемент еще в DOM и не наблюдаем ли мы уже этот элемент
        if (el.isConnected && !observedElementsRef.current.has(el) && observerRef.current) {
          try {
            observerRef.current.observe(el)
            observedElementsRef.current.add(el)
            
            // Немедленная активация для уже видимых элементов
            const rect = el.getBoundingClientRect()
            const isVisible = rect.top < window.innerHeight * 0.9 && rect.bottom > 0
            if (isVisible) {
              el.classList.add('reveal-in')
            }
          } catch (error) {
            // Игнорируем ошибки наблюдения (элемент может быть уже удален)
            if (process.env.NODE_ENV === 'development') {
              console.warn('RevealProvider: ошибка наблюдения элемента', error)
            }
          }
        }
      })
    }

    // Наблюдаем за изменениями в DOM
    const mutationObserver = new MutationObserver((mutations) => {
      let shouldObserve = false
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              if (element.classList.contains('reveal') || element.querySelector('.reveal')) {
                shouldObserve = true
              }
            }
          })
        }
      })
      
      if (shouldObserve) {
        // Небольшая задержка для стабильности
        setTimeout(observeElements, 100)
      }
    })

    // Запускаем наблюдение за DOM изменениями
    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true
    })

    // Первоначальное наблюдение
    observeElements()

    const observedElements = observedElementsRef.current

    // Очистка при размонтировании
    return () => {
      mutationObserver.disconnect()
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }
      observedElements.clear()
    }
  }, [])

  return <>{children}</>
}


