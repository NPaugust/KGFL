// Утилиты для форматирования данных

export const formatDate = (date: string | Date, locale: string = 'ru-RU'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export const formatDateTime = (date: string | Date, locale: string = 'ru-RU'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export const formatTime = (time: string | Date, locale: string = 'ru-RU'): string => {
  if (!time) return ''
  
  // Если строка уже в формате HH:MM, возвращаем как есть
  if (typeof time === 'string' && /^\d{2}:\d{2}$/.test(time)) {
    return time
  }
  
  // Если строка в формате HH:MM:SS, обрезаем секунды
  if (typeof time === 'string' && /^\d{2}:\d{2}:\d{2}$/.test(time)) {
    return time.slice(0, 5)
  }
  
  // Если это Date объект или строка, которую нужно распарсить
  const timeObj = typeof time === 'string' ? new Date(`2000-01-01T${time}`) : time
  try {
    return timeObj.toLocaleTimeString(locale, {
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch {
    return typeof time === 'string' ? time : ''
  }
}

export const formatCurrency = (amount: number | string, currency: string = 'USD'): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency
  }).format(num)
}

export const formatNumber = (number: number | string, locale: string = 'ru-RU'): string => {
  const num = typeof number === 'string' ? parseFloat(number) : number
  return new Intl.NumberFormat(locale).format(num)
}

export const formatPercentage = (value: number, decimals: number = 1): string => {
  return `${value.toFixed(decimals)}%`
}

export const formatAge = (birthDate: string | Date): number => {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  
  return age
}

export const formatPlayerName = (firstName: string, lastName: string): string => {
  return `${firstName} ${lastName}`
}

export const formatClubName = (name: string, shortName?: string): string => {
  return shortName ? `${name} (${shortName})` : name
}

export const formatMatchScore = (homeScore: number | null, awayScore: number | null): string => {
  if (homeScore === null || awayScore === null) {
    return 'vs'
  }
  return `${homeScore} - ${awayScore}`
}

export const formatMatchStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'scheduled': 'Запланирован',
    'live': 'В прямом эфире',
    'finished': 'Завершен',
    'postponed': 'Перенесен'
  }
  return statusMap[status] || status
}

export const formatPlayerPosition = (position: string): string => {
  const positionMap: Record<string, string> = {
    'GK': 'Вратарь',
    'DF': 'Защитник',
    'MF': 'Полузащитник',
    'FW': 'Нападающий'
  }
  return positionMap[position] || position
}

export const formatTransferStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Ожидает подтверждения',
    'confirmed': 'Подтвержден',
    'cancelled': 'Отменен'
  }
  return statusMap[status] || status
}

export const formatApplicationStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pending': 'Ожидает рассмотрения',
    'approved': 'Одобрена',
    'rejected': 'Отклонена',
    'withdrawn': 'Отозвана'
  }
  return statusMap[status] || status
}

export const formatRefereeCategory = (category: string): string => {
  const categoryMap: Record<string, string> = {
    'chief': 'Главный судья',
    'assistant': 'Помощник',
    'var': 'VAR',
    'inspector': 'Инспектор'
  }
  return categoryMap[category] || category
}

export const formatManagerPosition = (position: string): string => {
  const positionMap: Record<string, string> = {
    'president': 'Президент',
    'vice_president': 'Вице-президент',
    'general_secretary': 'Генеральный секретарь',
    'director': 'Директор',
    'manager': 'Менеджер'
  }
  return positionMap[position] || position
}

export const formatCardType = (cardType: string): string => {
  const cardTypeMap: Record<string, string> = {
    'yellow': 'Желтая',
    'red': 'Красная',
    'second_yellow': 'Вторая желтая'
  }
  return cardTypeMap[cardType] || cardType
}

export const formatGoalType = (goalType: string): string => {
  const goalTypeMap: Record<string, string> = {
    'goal': 'Гол',
    'penalty': 'Пенальти',
    'own_goal': 'Автогол',
    'free_kick': 'Свободный удар',
    'header': 'Головой'
  }
  return goalTypeMap[goalType] || goalType
}

export const formatTablePosition = (position: number): string => {
  if (position === 1) return '1-е место'
  if (position === 2) return '2-е место'
  if (position === 3) return '3-е место'
  return `${position}-е место`
}

export const formatSeasonName = (name: string, startDate?: string, endDate?: string): string => {
  if (startDate && endDate) {
    const start = new Date(startDate).getFullYear()
    const end = new Date(endDate).getFullYear()
    return `${name} (${start}/${end})`
  }
  return name
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const formatPhoneNumber = (phone: string): string => {
  // Убираем все нецифровые символы
  const cleaned = phone.replace(/\D/g, '')
  
  // Форматируем в зависимости от длины
  if (cleaned.length === 10) {
    return `+996 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  } else if (cleaned.length === 12 && cleaned.startsWith('996')) {
    return `+${cleaned.slice(0, 3)} (${cleaned.slice(3, 6)}) ${cleaned.slice(6, 9)}-${cleaned.slice(9)}`
  }
  
  return phone // Возвращаем оригинал, если не можем отформатировать
}

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + '...'
}

export const capitalizeFirst = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

export const formatRelativeTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)
  
  if (diffInSeconds < 60) return 'только что'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} мин назад`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ч назад`
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} дн назад`
  
  return formatDate(dateObj)
}
