// Утилиты для валидации данных

export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export const validateRequired = (value: any): boolean => {
  if (typeof value === 'string') {
    return value.trim().length > 0
  }
  return value !== null && value !== undefined
}

export const validateMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength
}

export const validateMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength
}

export const validateNumber = (value: any, min?: number, max?: number): boolean => {
  const num = Number(value)
  if (isNaN(num)) return false
  if (min !== undefined && num < min) return false
  if (max !== undefined && num > max) return false
  return true
}

export const validateDate = (date: string): boolean => {
  const dateObj = new Date(date)
  return dateObj instanceof Date && !isNaN(dateObj.getTime())
}

export const validateFutureDate = (date: string): boolean => {
  const dateObj = new Date(date)
  const now = new Date()
  return dateObj > now
}

export const validatePastDate = (date: string): boolean => {
  const dateObj = new Date(date)
  const now = new Date()
  return dateObj < now
}

export const validatePlayerNumber = (number: number, existingNumbers: number[]): boolean => {
  return number >= 1 && number <= 99 && !existingNumbers.includes(number)
}

export const validateClubForm = (formData: any): ValidationResult => {
  const errors: string[] = []

  if (!validateRequired(formData.name)) {
    errors.push('Название клуба обязательно')
  }

  if (!validateRequired(formData.city)) {
    errors.push('Город обязателен')
  }

  if (!validateRequired(formData.coach_full_name)) {
    errors.push('Имя тренера обязательно')
  }

  if (!validateRequired(formData.contact_phone)) {
    errors.push('Контактный телефон обязателен')
  } else if (!validatePhone(formData.contact_phone)) {
    errors.push('Неверный формат телефона')
  }

  if (formData.contact_email && !validateEmail(formData.contact_email)) {
    errors.push('Неверный формат email')
  }

  if (formData.founded && !validateNumber(formData.founded, 1800, new Date().getFullYear())) {
    errors.push('Неверный год основания')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validatePlayerForm = (formData: any): ValidationResult => {
  const errors: string[] = []

  if (!validateRequired(formData.first_name)) {
    errors.push('Имя игрока обязательно')
  }

  if (!validateRequired(formData.last_name)) {
    errors.push('Фамилия игрока обязательна')
  }

  if (!validateRequired(formData.date_of_birth)) {
    errors.push('Дата рождения обязательна')
  } else if (!validateDate(formData.date_of_birth)) {
    errors.push('Неверный формат даты рождения')
  } else if (!validatePastDate(formData.date_of_birth)) {
    errors.push('Дата рождения не может быть в будущем')
  }

  if (!validateRequired(formData.position)) {
    errors.push('Позиция игрока обязательна')
  }

  if (!validateRequired(formData.number)) {
    errors.push('Игровой номер обязателен')
  } else if (!validateNumber(formData.number, 1, 99)) {
    errors.push('Игровой номер должен быть от 1 до 99')
  }

  if (formData.height && !validateNumber(formData.height, 100, 250)) {
    errors.push('Рост должен быть от 100 до 250 см')
  }

  if (formData.weight && !validateNumber(formData.weight, 30, 150)) {
    errors.push('Вес должен быть от 30 до 150 кг')
  }

  if (formData.phone && !validatePhone(formData.phone)) {
    errors.push('Неверный формат телефона')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateMatchForm = (formData: any): ValidationResult => {
  const errors: string[] = []

  if (!validateRequired(formData.home_team)) {
    errors.push('Домашняя команда обязательна')
  }

  if (!validateRequired(formData.away_team)) {
    errors.push('Гостевая команда обязательна')
  }

  if (formData.home_team === formData.away_team) {
    errors.push('Команды не могут быть одинаковыми')
  }

  if (!validateRequired(formData.date)) {
    errors.push('Дата матча обязательна')
  } else if (!validateDate(formData.date)) {
    errors.push('Неверный формат даты')
  }

  if (!validateRequired(formData.time)) {
    errors.push('Время матча обязательно')
  }

  if (formData.home_score !== undefined && !validateNumber(formData.home_score, 0)) {
    errors.push('Счет домашней команды не может быть отрицательным')
  }

  if (formData.away_score !== undefined && !validateNumber(formData.away_score, 0)) {
    errors.push('Счет гостевой команды не может быть отрицательным')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateTransferForm = (formData: any): ValidationResult => {
  const errors: string[] = []

  if (!validateRequired(formData.player)) {
    errors.push('Игрок обязателен')
  }

  if (!validateRequired(formData.to_club)) {
    errors.push('Команда назначения обязательна')
  }

  if (formData.from_club === formData.to_club) {
    errors.push('Игрок не может перейти в ту же команду')
  }

  if (!validateRequired(formData.transfer_date)) {
    errors.push('Дата трансфера обязательна')
  } else if (!validateDate(formData.transfer_date)) {
    errors.push('Неверный формат даты трансфера')
  }

  if (formData.transfer_fee && !validateNumber(formData.transfer_fee, 0)) {
    errors.push('Сумма трансфера не может быть отрицательной')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateApplicationForm = (formData: any): ValidationResult => {
  const errors: string[] = []

  if (!validateRequired(formData.club_name)) {
    errors.push('Название клуба обязательно')
  }

  if (!validateRequired(formData.city)) {
    errors.push('Город обязателен')
  }

  if (!validateRequired(formData.contact_person)) {
    errors.push('Контактное лицо обязательно')
  }

  if (!validateRequired(formData.contact_phone)) {
    errors.push('Контактный телефон обязателен')
  } else if (!validatePhone(formData.contact_phone)) {
    errors.push('Неверный формат телефона')
  }

  if (formData.contact_email && !validateEmail(formData.contact_email)) {
    errors.push('Неверный формат email')
  }

  if (!validateRequired(formData.coach_name)) {
    errors.push('Имя тренера обязательно')
  }

  if (!validateRequired(formData.season)) {
    errors.push('Сезон обязателен')
  }

  if (formData.founded && !validateNumber(formData.founded, 1800, new Date().getFullYear())) {
    errors.push('Неверный год основания')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}
