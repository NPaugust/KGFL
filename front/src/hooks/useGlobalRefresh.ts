import { useEffect } from 'react'

/**
 * Хук для глобального обновления данных при изменениях
 */
export const useGlobalRefresh = (refetch?: () => void) => {
  useEffect(() => {
    const handleDataUpdate = (event: CustomEvent) => {
      // Обновляем данные в текущем компоненте
      if (refetch) {
        refetch()
      }
      
      // Принудительно обновляем страницу через 1 секунду
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    }

    // Слушаем события обновления данных
    window.addEventListener('data-updated', handleDataUpdate as EventListener)

    return () => {
      window.removeEventListener('data-updated', handleDataUpdate as EventListener)
    }
  }, [refetch])
}

export default useGlobalRefresh
