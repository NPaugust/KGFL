// Константы для KGFL

// Цвета позиций игроков
export const POSITION_COLORS = {
  GK: '#0EA5E9', // Голубой для вратарей (как небо)
  DF: '#10B981', // Изумрудный для защитников (стабильность)
  MF: '#8B5CF6', // Фиолетовый для полузащитников (креативность)
  FW: '#EF4444', // Красный для нападающих (агрессия)
  DEFAULT: '#6B7280' // Нейтральный серый для неизвестных позиций
} as const;

// Метки позиций (множественное число для селекторов)
export const POSITION_LABELS = {
  GK: 'Вратари',
  DF: 'Защитники', 
  MF: 'Полузащитники',
  FW: 'Нападающие'
} as const;

// Метки позиций (единственное число для игроков)
export const POSITION_LABELS_SINGULAR = {
  GK: 'Вратарь',
  DF: 'Защитник', 
  MF: 'Полузащитник',
  FW: 'Нападающий'
} as const;

// URL для дефолтного силуэта игрока
export const DEFAULT_PLAYER_SILHOUETTE = '/images/player-silhouette.png';

// Размеры карточек
export const CARD_SIZES = {
  PLAYER_PHOTO: {
    width: 200,
    height: 260,
    aspectRatio: '3:4'
  },
  CLUB_LOGO: {
    width: 160,
    height: 160
  }
} as const;
