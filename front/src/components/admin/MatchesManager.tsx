"use client"
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useMatches } from '@/hooks/useMatches'
import { useClubs } from '@/hooks/useClubs'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Match, Club } from '@/types'
import { Loading } from '../Loading'
import { formatDate } from '@/utils'
import { apiClient } from '@/services/api'
import { useSeasonStore } from '@/store/useSeasonStore'
import { useApi } from '@/hooks/useApi'
import { Modal, ConfirmModal } from '../ui/Modal'
import { Search } from '@/components/Search'
import { PaginationControls, DEFAULT_PAGE_SIZE } from './PaginationControls'

// Компонент фильтра групп для списка матчей
function GroupFilterForMatches({ seasonId, value, onChange }: { seasonId: string; value: string; onChange: (value: string) => void }) {
  const groupsUrl = API_ENDPOINTS.SEASON_GROUPS(seasonId)
  const { data: groupsData } = useApi<any[]>(groupsUrl, undefined, [seasonId])
  const groups = Array.isArray(groupsData) ? groupsData : []
  
  return (
    <select 
      value={value} 
      onChange={(e) => onChange(e.target.value)}
      className="input !rounded-none appearance-none h-10"
    >
      <option value="">Все группы</option>
      {groups.map((g: any) => (
        <option key={g.id} value={g.id}>{g.name}</option>
      ))}
    </select>
  )
}

// Вспомогательная функция для безопасного логирования ошибок
const logError = (message: string, error: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(message, error)
  }
  // В продакшене ошибки можно отправлять в Sentry или другой сервис мониторинга
}

const ITEMS_PER_PAGE = DEFAULT_PAGE_SIZE

interface MatchFormData {
  date: string
  time?: string
  home_team: string
  away_team: string
  stadium?: string
  stadium_ref?: string
  status: 'scheduled' | 'live' | 'finished' | 'cancelled' | 'postponed'
  home_score?: number
  away_score?: number
  season?: string
  // group убрано - определяется автоматически из групп команд
  // События матча
  goals: SimpleEvent[]
  assists: SimpleEvent[]
  yellow_cards: SimpleEvent[]
  red_cards: SimpleEvent[]
}

interface SimpleEvent { id: string; player_id: string; minute: number; team: 'home' | 'away' }

export function MatchesManager() {
  const { matches, loading, refetch } = useMatches()
  const { clubs } = useClubs()
  const { data: stadiums } = useApi<any[]>(API_ENDPOINTS.STADIUMS)
  const { data: allPlayers } = useApi<any[]>(API_ENDPOINTS.PLAYERS)
  const { seasons, selectedSeasonId } = useSeasonStore()
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [homePlayers, setHomePlayers] = useState<any[]>([])
  const [awayPlayers, setAwayPlayers] = useState<any[]>([])
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null)
  const [filterSeasonId, setFilterSeasonId] = useState<string>('')
  const [filterGroupId, setFilterGroupId] = useState<string>('') // Новый фильтр по группе
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [sortField, setSortField] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [formData, setFormData] = useState<MatchFormData>({
    date: '',
    time: '',
    home_team: '',
    away_team: '',
    stadium: '',
    stadium_ref: '',
    status: 'scheduled',
    home_score: undefined,
    away_score: undefined,
    season: '',
    goals: [],
    assists: [],
    yellow_cards: [],
    red_cards: []
  })
  const [activeMatchTab, setActiveMatchTab] = useState<'schedule' | 'teams' | 'events' | 'extras'>('schedule')
  const [currentPage, setCurrentPage] = useState(1)

  const matchStatusOptions = [
    { value: 'scheduled', label: 'Запланирован' },
    { value: 'live', label: 'В прямом эфире' },
    { value: 'finished', label: 'Завершен' },
    { value: 'cancelled', label: 'Отменен' },
    { value: 'postponed', label: 'Перенесен' }
  ]
  const matchModalTabs: { id: 'schedule' | 'teams' | 'events' | 'extras'; label: string; description: string }[] = [
    { id: 'schedule', label: 'Планирование', description: 'Дата, время, сезон, стадион' },
    { id: 'teams', label: 'Команды', description: 'Выбор клубов и группы' },
    { id: 'extras', label: 'Статус и счет', description: 'Статус матча и счет' },
    { id: 'events', label: 'События', description: 'Голы, карточки, ассисты' }
  ]

  const resetFilters = () => {
    setSearchTerm('')
    setStatusFilter(null)
    setFilterSeasonId('')
    setFilterGroupId('')
  }

useEffect(() => {
  setCurrentPage(1)
}, [searchTerm, statusFilter, filterSeasonId, filterGroupId])
  
  // Загружаем группы для выбранного сезона (только для фильтрации команд)
  const groupsUrl = formData.season && formData.season.trim() !== '' 
    ? API_ENDPOINTS.SEASON_GROUPS(formData.season)
    : null
  const { data: groupsData } = useApi<any[]>(groupsUrl, undefined, [formData.season])
  const groups = Array.isArray(groupsData) ? groupsData : []
  
  // Состояние для фильтрации команд по группе (только для UI, не отправляется на сервер)
  const [groupFilter, setGroupFilter] = useState<string | null>(null)
  
  // Определяем группу матча из выбранных команд (для отображения)
  const [matchGroupInfo, setMatchGroupInfo] = useState<{ id: string | null; name: string | null } | null>(null)
  
  // Загружаем клубы для выбранного сезона и группы-фильтра (если указаны)
  const clubsByGroupUrl = formData.season && formData.season.trim() !== '' 
    ? `${API_ENDPOINTS.CLUBS_BY_SEASON_GROUP}?season=${formData.season}${groupFilter ? `&group=${groupFilter}` : ''}`
    : null
  const { data: clubsByGroupData } = useApi<any[]>(clubsByGroupUrl, undefined, [formData.season, groupFilter])
  const availableClubs = formData.season && groupFilter 
    ? (Array.isArray(clubsByGroupData) ? clubsByGroupData : [])
    : (Array.isArray(clubs) ? clubs : [])
  
  // Определяем группу матча из выбранных команд (для отображения)
  const determineMatchGroup = useCallback(async () => {
    if (!formData.home_team || !formData.away_team || !formData.season) {
      setMatchGroupInfo(null)
      return
    }
    
    try {
      // Загружаем информацию о клубах для определения их групп
      const [homeClubData, awayClubData] = await Promise.all([
        apiClient.get(API_ENDPOINTS.CLUB_DETAIL(formData.home_team)),
        apiClient.get(API_ENDPOINTS.CLUB_DETAIL(formData.away_team))
      ]) as [any, any]
      
      // Ищем ClubSeason для выбранного сезона
      const homeClubSeason = homeClubData.seasons?.find((cs: any) => 
        cs.season?.toString() === formData.season || cs.season_id?.toString() === formData.season
      )
      const awayClubSeason = awayClubData.seasons?.find((cs: any) => 
        cs.season?.toString() === formData.season || cs.season_id?.toString() === formData.season
      )
      
      if (homeClubSeason?.group_id && awayClubSeason?.group_id) {
        if (homeClubSeason.group_id === awayClubSeason.group_id) {
          setMatchGroupInfo({
            id: homeClubSeason.group_id.toString(),
            name: homeClubSeason.group_name || 'Группа'
          })
        } else {
          setMatchGroupInfo({
            id: null,
            name: `⚠️ Команды в разных группах: "${homeClubSeason.group_name || 'Без группы'}" и "${awayClubSeason.group_name || 'Без группы'}"`
          })
        }
      } else {
        setMatchGroupInfo(null)
      }
    } catch (error) {
      setMatchGroupInfo(null)
    }
  }, [formData.home_team, formData.away_team, formData.season])
  
  const normalizeId = (value: any): string => {
    if (value === null || value === undefined) return ''
    if (typeof value === 'object') {
      if ('id' in value && value.id !== undefined && value.id !== null) {
        return String(value.id)
      }
      if ('pk' in value && value.pk !== undefined && value.pk !== null) {
        return String((value as any).pk)
      }
    }
    return String(value)
  }
  
  // Существующие события матча (из базы данных)
  const [existingEvents, setExistingEvents] = useState<{
    goals: any[],
    cards: any[],
    assists: any[],
    substitutions: any[]
  }>({
    goals: [],
    cards: [],
    assists: [],
    substitutions: []
  })
  
  // Состояние для показа/скрытия истории матча
  const [showHistory, setShowHistory] = useState(false)

  const { mutate, loading: mutationLoading, error } = useApiMutation<Match>()

  // Вычисляемые переменные для счета
  const baseHomeScore = formData.home_score !== undefined ? formData.home_score : (editingMatch ? (editingMatch as any).home_score || 0 : 0)
  const baseAwayScore = formData.away_score !== undefined ? formData.away_score : (editingMatch ? (editingMatch as any).away_score || 0 : 0)
  const computedHome = baseHomeScore + formData.goals.filter(g => g.team === 'home').length
  const computedAway = baseAwayScore + formData.goals.filter(g => g.team === 'away').length

  // Названия команд
  const homeName = clubs?.find((c: any) => c.id.toString() === formData.home_team)?.name || 'Домашняя команда'
  const awayName = clubs?.find((c: any) => c.id.toString() === formData.away_team)?.name || 'Гостевая команда'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
      // Предупреждение о наличии игроков в командах (не блокируем создание матча)
    // Убрали проверку - матч можно создать в любом случае
    
    try {
      const homeTeamId = formData.home_team
      const awayTeamId = formData.away_team
      
      // При редактировании считаем счет из всех событий (существующих + новых)
      let computedHome = 0
      let computedAway = 0
      
      if (editingMatch) {
        // Подсчитываем существующие голы
        const existingHomeGoals = existingEvents.goals.filter((g: any) => {
          const teamId = g.team?.toString() || (g.team as any)?.id?.toString()
          return teamId === homeTeamId
        }).length
        
        const existingAwayGoals = existingEvents.goals.filter((g: any) => {
          const teamId = g.team?.toString() || (g.team as any)?.id?.toString()
          return teamId === awayTeamId
        }).length
        
        // Подсчитываем новые голы из формы (только те, что уже есть в БД или новые)
        const formHomeGoals = formData.goals.filter(g => g.team === 'home' && g.player_id).length
        const formAwayGoals = formData.goals.filter(g => g.team === 'away' && g.player_id).length
        
        // Используем счет из формы, если задан явно, иначе из существующих + новых событий
        computedHome = formData.home_score !== undefined && formData.home_score !== null 
          ? formData.home_score 
          : Math.max(existingHomeGoals, formHomeGoals)
        computedAway = formData.away_score !== undefined && formData.away_score !== null 
          ? formData.away_score 
          : Math.max(existingAwayGoals, formAwayGoals)
      } else {
        // При создании нового матча: базовый счет + новые голы
        computedHome = formData.home_score !== undefined ? formData.home_score : (baseHomeScore + formData.goals.filter(g => g.team === 'home').length)
        computedAway = formData.away_score !== undefined ? formData.away_score : (baseAwayScore + formData.goals.filter(g => g.team === 'away').length)
      }

      const submitData = {
        home_team: formData.home_team || null,
        away_team: formData.away_team || null,
        date: formData.date || null,
        time: formData.time || null,
        stadium_ref: formData.stadium_ref || null,
        status: formData.status,
        home_score: formData.status === 'scheduled' ? null : computedHome,
        away_score: formData.status === 'scheduled' ? null : computedAway,
        season: formData.season && formData.season.trim() !== '' ? formData.season : null,
        // group НЕ отправляем - определяется автоматически из групп команд на бэкенде
        // При создании нового матча включаем события в данные
        // При редактировании события обрабатываются отдельно
        ...(editingMatch ? {} : {
          goals: formData.goals,
          assists: formData.assists,
          yellow_cards: formData.yellow_cards,
          red_cards: formData.red_cards
        })
      }

      let savedMatch: any
      if (editingMatch) {
        savedMatch = await mutate(API_ENDPOINTS.MATCH_DETAIL(editingMatch.id.toString()), 'PUT', submitData)
      } else {
        console.log('Создание матча с данными:', submitData)
        savedMatch = await mutate(API_ENDPOINTS.MATCHES, 'POST', submitData)
        console.log('Матч создан:', savedMatch)
      }

      const matchId = (savedMatch as any)?.id || editingMatch?.id?.toString()
      
      if (matchId && editingMatch) {
        // При редактировании обрабатываем события
        // Получаем текущие ID событий из БД
        const existingGoalIds = new Set(existingEvents.goals.map((g: any) => g.id?.toString() || g.goal_id?.toString()))
        const existingCardIds = new Set(existingEvents.cards.map((c: any) => c.id?.toString() || c.card_id?.toString()))
        const existingAssistIds = new Set(existingEvents.assists.map((a: any) => a.id?.toString() || a.assist_id?.toString()))
        
        // Определяем какие события нужно удалить (есть в БД, но нет в форме)
        const formGoalIds = new Set(formData.goals.filter(g => g.id && !g.id.toString().startsWith('temp_')).map(g => g.id.toString()))
        const formCardIds = new Set([...formData.yellow_cards, ...formData.red_cards].filter(c => c.id && !c.id.toString().startsWith('temp_')).map(c => c.id.toString()))
        const formAssistIds = new Set(formData.assists.filter(a => a.id && !a.id.toString().startsWith('temp_')).map(a => a.id.toString()))
        
        // Удаляем события, которых нет в форме
        for (const goal of existingEvents.goals) {
          const goalId = goal.id?.toString() || goal.goal_id?.toString()
          if (goalId && !formGoalIds.has(goalId)) {
            try {
              await apiClient.delete(`${API_ENDPOINTS.GOALS}${goalId}/`)
            } catch (error) {
              logError('Ошибка удаления гола:', error)
            }
          }
        }
        
        for (const card of existingEvents.cards) {
          const cardId = card.id?.toString() || card.card_id?.toString()
          if (cardId && !formCardIds.has(cardId)) {
            try {
              await apiClient.delete(`${API_ENDPOINTS.CARDS}${cardId}/`)
            } catch (error) {
              logError('Ошибка удаления карточки:', error)
            }
          }
        }
        
        for (const assist of existingEvents.assists) {
          const assistId = assist.id?.toString() || assist.assist_id?.toString()
          if (assistId && !formAssistIds.has(assistId)) {
            try {
              await apiClient.delete(`${API_ENDPOINTS.ASSISTS}${assistId}/`)
            } catch (error) {
              logError('Ошибка удаления ассиста:', error)
            }
          }
        }
        
        // Создаем или обновляем события из формы
        for (const goal of formData.goals) {
          if (goal.player_id && goal.minute) {
            const goalId = goal.id?.toString()
            if (goalId && !goalId.startsWith('temp_') && existingGoalIds.has(goalId)) {
              // Обновляем существующий гол
              try {
                await apiClient.put(`${API_ENDPOINTS.GOALS}${goalId}/`, {
                  scorer: goal.player_id,
                  team: goal.team === 'home' ? homeTeamId : awayTeamId,
                  minute: goal.minute
                })
              } catch (error) {
                logError('Ошибка обновления гола:', error)
              }
            } else {
              // Создаем новый гол
              try {
                await apiClient.post(`${API_ENDPOINTS.MATCH_DETAIL(matchId)}add_goal/`, {
                  scorer: goal.player_id,
                  team: goal.team === 'home' ? homeTeamId : awayTeamId,
                  minute: goal.minute
                })
              } catch (error) {
                logError('Ошибка создания гола:', error)
              }
            }
          }
        }
        
        for (const assist of formData.assists) {
          if (assist.player_id && assist.minute) {
            const assistId = assist.id?.toString()
            if (assistId && !assistId.startsWith('temp_') && existingAssistIds.has(assistId)) {
              // Обновляем существующий ассист
              try {
                await apiClient.put(`${API_ENDPOINTS.ASSISTS}${assistId}/`, {
                  player: assist.player_id,
                  team: assist.team === 'home' ? homeTeamId : awayTeamId,
                  minute: assist.minute
                })
              } catch (error) {
                logError('Ошибка обновления ассиста:', error)
              }
            } else {
              // Создаем новый ассист
              try {
                await apiClient.post(`${API_ENDPOINTS.MATCH_DETAIL(matchId)}add_assist/`, {
                  player: assist.player_id,
                  team: assist.team === 'home' ? homeTeamId : awayTeamId,
                  minute: assist.minute
                })
              } catch (error) {
                logError('Ошибка создания ассиста:', error)
              }
            }
          }
        }
        
        for (const card of [...formData.yellow_cards, ...formData.red_cards]) {
          if (card.player_id && card.minute) {
            const cardId = card.id?.toString()
            const isYellow = formData.yellow_cards.includes(card)
            if (cardId && !cardId.startsWith('temp_') && existingCardIds.has(cardId)) {
              // Обновляем существующую карточку
              try {
                await apiClient.put(`${API_ENDPOINTS.CARDS}${cardId}/`, {
                  player: card.player_id,
                  team: card.team === 'home' ? homeTeamId : awayTeamId,
                  minute: card.minute,
                  card_type: isYellow ? 'yellow' : 'red'
                })
              } catch (error) {
                logError('Ошибка обновления карточки:', error)
              }
            } else {
              // Создаем новую карточку
              try {
                await apiClient.post(`${API_ENDPOINTS.MATCH_DETAIL(matchId)}add_card/`, {
                  player: card.player_id,
                  team: card.team === 'home' ? homeTeamId : awayTeamId,
                  minute: card.minute,
                  card_type: isYellow ? 'yellow' : 'red'
                })
              } catch (error) {
                logError('Ошибка создания карточки:', error)
              }
            }
          }
        }
      }

      setIsModalOpen(false)
      setEditingMatch(null)
      setExistingEvents({ goals: [], cards: [], assists: [], substitutions: [] })
      setFormData({ 
        date: '', 
        time: '', 
        home_team: '', 
        away_team: '', 
        stadium: '', 
        stadium_ref: '', 
        status: 'scheduled', 
        home_score: undefined, 
        away_score: undefined, 
        season: selectedSeasonId || '', 
        goals: [], 
        assists: [], 
        yellow_cards: [], 
        red_cards: []
      })
      
      // Отправляем событие для обновления всех компонентов после закрытия модального окна
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('data-refresh', { 
          detail: { 
            type: 'match', 
            id: matchId,
            action: editingMatch ? 'updated' : 'created'
          } 
        }))
        // Обновляем статистику игроков и клубов
        window.dispatchEvent(new CustomEvent('data-refresh', { 
          detail: { 
            type: 'player_stats',
            action: 'updated'
          } 
        }))
        refetch() // Обновляем список матчей
      }, 100)
    } catch (error: any) {
      console.error('Ошибка при сохранении матча:', error)
      const errorMessage = error?.response?.data?.detail || error?.response?.data?.message || error?.message || 'Неизвестная ошибка'
      alert(`Ошибка при сохранении матча: ${errorMessage}`)
    }
  }

  const handleEdit = async (match: Match) => {
    setEditingMatch(match)
    
    const homeTeamId = match.home_team ? (typeof match.home_team === 'object' ? (match.home_team as any).id?.toString() || '' : String(match.home_team)) : ''
    const awayTeamId = match.away_team ? (typeof match.away_team === 'object' ? (match.away_team as any).id?.toString() || '' : String(match.away_team)) : ''
    
    // Загружаем существующие события через API
    let existingGoals: any[] = []
    let existingCards: any[] = []
    let existingAssists: any[] = []
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL
      const [goalsRes, cardsRes, assistsRes] = await Promise.all([
        fetch(`${baseUrl}/matches/${match.id}/goals/`),
        fetch(`${baseUrl}/matches/${match.id}/cards/`),
        fetch(`${baseUrl}/matches/${match.id}/assists/`).catch(() => ({ ok: false })) // Ассисты могут не существовать
      ])
      
      if (goalsRes.ok) {
        existingGoals = await goalsRes.json()
      }
      if (cardsRes.ok) {
        existingCards = await cardsRes.json()
      }
      if (assistsRes.ok) {
        existingAssists = await (assistsRes as Response).json()
      }
      
      setExistingEvents({
        goals: existingGoals || [],
        cards: existingCards || [],
        assists: existingAssists || [],
        substitutions: [] // пока не загружаем замены
      })
    } catch (error) {
      setExistingEvents({ goals: [], cards: [], assists: [], substitutions: [] })
    }
    
    // Используем события из API для формы
    const goals = (existingGoals || []).map((goal: any) => ({
      id: goal.id?.toString() || goal.goal_id?.toString() || `temp_${Date.now()}`,
      player_id: goal.scorer?.id?.toString() || goal.scorer?.toString() || goal.scorer_id?.toString() || '',
      minute: goal.minute || 1,
      team: (goal.team?.toString() === homeTeamId || (goal.team as any)?.id?.toString() === homeTeamId ? 'home' : 'away') as 'home' | 'away'
    }))
    
    // Разделяем карточки на желтые и красные
    const yellow_cards = (existingCards || []).filter((card: any) => card.card_type === 'yellow').map((card: any) => ({
      id: card.id?.toString() || card.card_id?.toString() || `temp_${Date.now()}`,
      player_id: card.player?.id?.toString() || card.player?.toString() || card.player_id?.toString() || '',
      minute: card.minute || 1,
      team: (card.team?.toString() === homeTeamId || (card.team as any)?.id?.toString() === homeTeamId ? 'home' : 'away') as 'home' | 'away'
    }))
    
    const red_cards = (existingCards || []).filter((card: any) => card.card_type === 'red').map((card: any) => ({
      id: card.id?.toString() || card.card_id?.toString() || `temp_${Date.now()}`,
      player_id: card.player?.id?.toString() || card.player?.toString() || card.player_id?.toString() || '',
      minute: card.minute || 1,
      team: (card.team?.toString() === homeTeamId || (card.team as any)?.id?.toString() === homeTeamId ? 'home' : 'away') as 'home' | 'away'
    }))
    
    // Ассисты
    const assists = (existingAssists || []).map((assist: any) => ({
      id: assist.id?.toString() || assist.assist_id?.toString() || `temp_${Date.now()}`,
      player_id: assist.player?.id?.toString() || assist.player?.toString() || assist.player_id?.toString() || '',
      minute: assist.minute || 1,
      team: (assist.team?.toString() === homeTeamId || (assist.team as any)?.id?.toString() === homeTeamId ? 'home' : 'away') as 'home' | 'away'
    }))
    
    // Вычисляем счет из существующих голов
    const existingHomeGoals = existingGoals.filter((g: any) => {
      const teamId = g.team?.toString() || (g.team as any)?.id?.toString()
      return teamId === homeTeamId
    }).length
    
    const existingAwayGoals = existingGoals.filter((g: any) => {
      const teamId = g.team?.toString() || (g.team as any)?.id?.toString()
      return teamId === awayTeamId
    }).length
    
    // Используем счет из матча или вычисляем из голов
    const matchHomeScore = match.home_score !== null && match.home_score !== undefined ? match.home_score : existingHomeGoals
    const matchAwayScore = match.away_score !== null && match.away_score !== undefined ? match.away_score : existingAwayGoals
    
    setFormData({
      date: match.date || '',
      time: match.time || '',
      home_team: homeTeamId,
      away_team: awayTeamId,
      stadium: match.stadium || '',
      stadium_ref: (match as any).stadium_ref?.id?.toString() || (match as any).stadium_ref?.toString() || (match as any).stadium?.toString() || '',
      status: match.status || 'scheduled',
      home_score: match.status === 'scheduled' ? undefined : matchHomeScore,
      away_score: match.status === 'scheduled' ? undefined : matchAwayScore,
      season: (match as any).season?.toString() || '',
      goals: goals,
      assists: assists,
      yellow_cards: yellow_cards,
      red_cards: red_cards
    })
    
    // Загружаем игроков команд
    if (homeTeamId) loadPlayers(homeTeamId, 'home')
    if (awayTeamId) loadPlayers(awayTeamId, 'away')
    
    setActiveMatchTab('schedule')
    setIsModalOpen(true)
  }

  const handleDelete = (match: Match) => {
    setMatchToDelete(match)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!matchToDelete) return
    
    try {
      await apiClient.delete(API_ENDPOINTS.MATCH_DETAIL(matchToDelete.id))
      
      // Отправляем событие для обновления всех компонентов
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { 
          type: 'match', 
          id: matchToDelete.id,
          action: 'deleted'
        } 
      }))
      
      // Дополнительное событие для принудительного обновления статистики
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('data-refresh', { 
          detail: { 
            type: 'player_stats', 
            action: 'force_refresh'
          } 
        }))
        window.dispatchEvent(new CustomEvent('data-refresh', { 
          detail: { 
            type: 'club_stats', 
            action: 'force_refresh'
          } 
        }))
      }, 500)
      
      setDeleteModalOpen(false)
      setMatchToDelete(null)
    } catch (error: any) {
      alert(`Ошибка при удалении матча: ${error?.message || ''}`)
    }
  }

  // Удаление существующих событий из истории матча (голы/карточки/ассисты)
  const deleteExistingEvent = async (type: 'goal' | 'card' | 'assist', event: any) => {
    try {
      if (!editingMatch) return
      
      // Простое удаление по ID события
      const eventId = event.id || event.goal_id || event.card_id || event.assist_id
      if (!eventId) {
        alert('Не удалось определить ID события для удаления')
        return
      }

      const urlPath = type === 'goal' ? `${process.env.NEXT_PUBLIC_API_URL}/goals/${eventId}/` : 
                     type === 'assist' ? `${process.env.NEXT_PUBLIC_API_URL}/assists/${eventId}/` : 
                     `${process.env.NEXT_PUBLIC_API_URL}/cards/${eventId}/`
      
      await fetch(urlPath, { method: 'DELETE' })

      // Обновляем локальное состояние сразу
      setExistingEvents(prev => ({
        ...prev,
        goals: type === 'goal' ? prev.goals.filter((g: any) => g.id !== eventId) : prev.goals,
        assists: type === 'assist' ? prev.assists.filter((a: any) => a.id !== eventId) : prev.assists,
        cards: type === 'card' ? prev.cards.filter((c: any) => c.id !== eventId) : prev.cards,
      }))

      // Обновляем матч для актуального счета
      if (editingMatch) {
        const matchDetail = await (apiClient as any).get(API_ENDPOINTS.MATCH_DETAIL(editingMatch.id.toString()))
        setEditingMatch(matchDetail as any)
      }

      // Уведомляем другие компоненты об обновлении
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { 
          type: 'match', 
          id: editingMatch?.id,
          action: 'event_deleted'
        } 
      }))
      
    } catch (error: any) {
      alert(`Ошибка при удалении события: ${error?.message || ''}`)
    }
  }

  const addEvent = (type: 'goals' | 'assists' | 'yellow_cards' | 'red_cards') => {
    // Проверяем, что выбраны команды
    if (!formData.home_team || !formData.away_team) {
      alert('Сначала выберите домашнюю и гостевую команды!')
      return
    }
    
    const base: any = { id: `temp_${Date.now()}`, player_id: '', minute: 1, team: 'home' }
    setFormData({ ...formData, [type]: [...formData[type], base] })
  }
  const updateEvent = (type: 'goals' | 'assists' | 'yellow_cards' | 'red_cards', eventId: string, field: string, value: any) => {
    setFormData({ ...formData, [type]: formData[type].map(event => event.id === eventId ? { ...event, [field]: value } : event) })
  }
  const removeEvent = (type: 'goals' | 'assists' | 'yellow_cards' | 'red_cards', eventId: string) => {
    setFormData({ ...formData, [type]: formData[type].filter(event => event.id !== eventId) })
  }

  const loadPlayers = useCallback((clubId: string, side: 'home'|'away') => {
    if (!clubId || !allPlayers) return
    
    const clubPlayers = allPlayers.filter((player: any) => {
      const playerClubId = normalizeId(player.club)
      return playerClubId === clubId.toString()
    })
    
    if (side === 'home') {
      setHomePlayers(clubPlayers)
    } else {
      setAwayPlayers(clubPlayers)
    }
  }, [allPlayers])

  useEffect(() => {
    if (!isModalOpen) return
    if (formData.home_team) loadPlayers(formData.home_team, 'home')
    if (formData.away_team) loadPlayers(formData.away_team, 'away')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, formData.home_team, formData.away_team])

  // Загружаем игроков при изменении команд
  useEffect(() => {
    if (formData.home_team) loadPlayers(formData.home_team, 'home')
  }, [formData.home_team, loadPlayers])

  useEffect(() => {
    if (formData.away_team) loadPlayers(formData.away_team, 'away')
  }, [formData.away_team, loadPlayers])

  // Загружаем игроков когда allPlayers загрузится
  useEffect(() => {
    if (allPlayers && formData.home_team) loadPlayers(formData.home_team, 'home')
    if (allPlayers && formData.away_team) loadPlayers(formData.away_team, 'away')
  }, [allPlayers, formData.home_team, formData.away_team, loadPlayers])

  const matchesList = useMemo(() => Array.isArray(matches) ? matches : [], [matches])
  const clubsList = useMemo(() => Array.isArray(clubs) ? clubs : [], [clubs])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredMatches = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()

    return matchesList.filter((match: any) => {
      if (
        filterSeasonId &&
        (match.season?.toString() !== filterSeasonId &&
          (match as any).season_id?.toString() !== filterSeasonId)
      ) {
        return false
      }

      if (
        filterGroupId &&
        (match.group?.toString() !== filterGroupId &&
          (match as any).group_id?.toString() !== filterGroupId)
      ) {
        return false
      }

      if (statusFilter && match.status !== statusFilter) {
        return false
      }

      if (normalizedSearch) {
        const haystack = `${match.home_team_name || ''} ${(match as any).home_team?.name || ''} ${match.away_team_name || ''} ${(match as any).away_team?.name || ''}`.toLowerCase()
        if (!haystack.includes(normalizedSearch)) {
          return false
        }
      }

      return true
    })
  }, [matchesList, filterSeasonId, filterGroupId, statusFilter, searchTerm])

  const sortedMatches = useMemo(() => {
    const matchesToSort = [...filteredMatches]

    return matchesToSort.sort((a: any, b: any) => {
    if (!sortField) return 0
    
    let aValue: any = a[sortField as keyof typeof a]
    let bValue: any = b[sortField as keyof typeof b]
    
    // Специальная обработка для разных полей
    if (sortField === 'date') {
      aValue = aValue ? new Date(aValue).getTime() : 0
      bValue = bValue ? new Date(bValue).getTime() : 0
    } else if (sortField === 'season_name') {
      aValue = (a as any).season_name || ''
      bValue = (b as any).season_name || ''
    } else if (sortField === 'home_score' || sortField === 'away_score') {
      aValue = aValue ?? -1
      bValue = bValue ?? -1
    }
    
    // Для строк
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase()
      bValue = (bValue || '').toLowerCase()
    }
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })
}, [filteredMatches, sortField, sortDirection])

const totalMatches = sortedMatches.length
const totalMatchPages = Math.max(1, Math.ceil(totalMatches / ITEMS_PER_PAGE))
const safeMatchPage = Math.min(currentPage, totalMatchPages)

useEffect(() => {
  if (currentPage !== safeMatchPage) {
    setCurrentPage(safeMatchPage)
  }
}, [currentPage, safeMatchPage])

const paginatedMatches = useMemo(() => {
  const startIndex = (safeMatchPage - 1) * ITEMS_PER_PAGE
  return sortedMatches.slice(startIndex, startIndex + ITEMS_PER_PAGE)
}, [sortedMatches, safeMatchPage])

  if (loading) {
    return <Loading />
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">Управление матчами</h1>
          <button
            onClick={() => {
              setEditingMatch(null)
              setExistingEvents({ goals: [], cards: [], assists: [], substitutions: [] })
              setFormData({
                date: '',
                time: '',
                home_team: '',
                away_team: '',
                stadium: '',
                stadium_ref: '',
                status: 'scheduled',
                home_score: undefined,
                away_score: undefined,
                season: selectedSeasonId || '',
                goals: [],
                assists: [],
                yellow_cards: [],
                red_cards: []
              })
              setActiveMatchTab('schedule')
              setIsModalOpen(true)
            }}
            className="btn btn-primary whitespace-nowrap"
          >
            Добавить матч
          </button>
        </div>

        <div className="card bg-white/5 border border-white/10 p-4 rounded-none">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1 min-w-[220px]">
              {/* Новый стиль поиска на базе общего компонента */}
              <Search
                placeholder="Поиск по командам"
                onSearch={setSearchTerm}
                className="w-full"
                hideIcon
                square
                initialValue={searchTerm}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <select 
                value={filterSeasonId} 
                onChange={(e) => {
                  setFilterSeasonId(e.target.value)
                  setFilterGroupId('')
                }}
                className="input min-w-[150px] !rounded-none appearance-none h-10"
              >
                <option value="">Все сезоны</option>
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>

              {filterSeasonId && (() => {
                const selectedSeason = seasons.find(s => s.id.toString() === filterSeasonId)
                // Проверяем наличие групп через API, так как format может отсутствовать в типе Season из store
                return (
                  <GroupFilterForMatches
                    seasonId={filterSeasonId}
                    value={filterGroupId}
                    onChange={setFilterGroupId}
                  />
                )
              })()}

              <button
                onClick={resetFilters}
                className="btn btn-outline whitespace-nowrap !rounded-none h-10 px-4"
                disabled={!searchTerm && !statusFilter && !filterSeasonId && !filterGroupId}
              >
                Сбросить
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {matchStatusOptions.map((option) => {
              const isActive = statusFilter === option.value
              return (
                <button
                  key={option.value}
                  onClick={() => setStatusFilter(isActive ? null : option.value)}
                  className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                    isActive
                      ? 'border-brand-primary bg-brand-primary/20 text-brand-primary'
                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('date')}
                >
                  Дата {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('season_name')}
                >
                  Сезон {sortField === 'season_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left">Группа</th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('home_team_name')}
                >
                  Домашняя {sortField === 'home_team_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('away_team_name')}
                >
                  Гостевая {sortField === 'away_team_name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left">Счет</th>
                <th className="px-4 py-3 text-left">Стадион</th>
                <th 
                  className="px-4 py-3 text-left cursor-pointer hover:bg-white/10 transition-colors select-none"
                  onClick={() => handleSort('status')}
                >
                  Статус {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMatches.length > 0 ? paginatedMatches.map((match: any) => (
                <tr key={match.id} className="border-t border-white/10">
                  <td className="px-4 py-3">{formatDate(match.date)} {match.time}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-brand-primary/20 text-brand-primary rounded text-sm">
                      {(match as any).season_name || ((match as any).season?.name) || 'Без сезона'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {(match as any).group_name ? (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-sm">
                        {(match as any).group_name}
                      </span>
                    ) : (
                      <span className="text-white/40 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{match.home_team_name}</td>
                  <td className="px-4 py-3">{match.away_team_name}</td>
                  <td className="px-4 py-3">{match.home_score !== null ? `${match.home_score} - ${match.away_score}` : '—'}</td>
                  <td className="px-4 py-3">
                    {(() => {
                      const stadiumId = (match as any).stadium_ref || (match as any).stadium
                      if (!stadiumId) return '-'
                      
                      // Если стадионы загружены, ищем по ID
                      if (Array.isArray(stadiums) && stadiums.length > 0) {
                        const stadium = stadiums.find((s: any) => s.id.toString() === stadiumId.toString())
                        if (stadium) {
                          return `${stadium.name}${stadium.city ? `, ${stadium.city}` : ''}`
                        }
                      }
                      
                      // Если стадион не найден, показываем ID
                      return `Стадион #${stadiumId}`
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      match.status === 'live' ? 'bg-red-500/20 text-red-400' :
                      match.status === 'finished' ? 'bg-green-500/20 text-green-400' :
                      match.status === 'cancelled' ? 'bg-gray-500/20 text-gray-400' :
                      match.status === 'postponed' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {match.status === 'live' ? 'Матч идёт' :
                       match.status === 'finished' ? 'Завершён' :
                       match.status === 'cancelled' ? 'Отменён' :
                       match.status === 'postponed' ? 'Перенесён' :
                       'Запланирован'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(match)} className="btn btn-outline text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(match)} className="btn bg-red-500 hover:bg-red-600 text-white text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-white/60">
                    {sortedMatches.length === 0 ? 'Матчи не найдены' : 'Нет результатов для текущей страницы'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationControls
        page={safeMatchPage}
        pageSize={ITEMS_PER_PAGE}
        totalItems={totalMatches}
        onPageChange={setCurrentPage}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingMatch(null)
          setExistingEvents({ goals: [], cards: [], assists: [], substitutions: [] })
          setFormData({
            date: '',
            time: '',
            home_team: '',
            away_team: '',
            stadium: '',
            stadium_ref: '',
            status: 'scheduled',
            home_score: undefined,
            away_score: undefined,
            season: selectedSeasonId || '',
            goals: [],
            assists: [],
            yellow_cards: [],
            red_cards: []
          })
          setGroupFilter(null)
          setMatchGroupInfo(null)
          setActiveMatchTab('schedule')
        }}
        title={editingMatch ? 'Редактировать матч' : 'Добавить матч'}
        size="2xl"
        className="max-w-6xl"
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-2">
              {matchModalTabs.map((tab) => {
                const isActive = activeMatchTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveMatchTab(tab.id)}
                    className={`px-4 py-2 rounded-xl border transition-all text-sm font-medium ${
                      isActive
                        ? 'border-brand-primary bg-brand-primary/20 text-brand-primary shadow-[0_0_20px_rgba(0,140,255,0.2)]'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div>{tab.label}</div>
                    <div className="text-xs text-white/50 font-normal">{tab.description}</div>
                  </button>
                )
              })}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              {activeMatchTab === 'schedule' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Дата *</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="input w-full"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Время *</label>
                      <input
                        type="time"
                        value={formData.time || ''}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="input w-full"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Сезон</label>
                      <select
                        value={formData.season || ''}
                        onChange={(e) => {
                          setFormData({ ...formData, season: e.target.value, home_team: '', away_team: '' })
                          setGroupFilter(null)
                        }}
                        className="input w-full"
                      >
                        <option value="">Все сезоны</option>
                        {seasons.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Стадион *</label>
                      <select
                        value={formData.stadium_ref || ''}
                        onChange={(e) => setFormData({ ...formData, stadium_ref: e.target.value })}
                        className="input w-full"
                        required
                      >
                        <option value="">—</option>
                        {Array.isArray(stadiums) && stadiums.map((s: any) => (
                          <option key={s.id} value={s.id}>
                            {s.name}
                            {s.city ? `, ${s.city}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeMatchTab === 'teams' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Домашняя команда *</label>
                      <select
                        value={formData.home_team}
                        onChange={(e) => {
                          setFormData({ ...formData, home_team: e.target.value })
                          loadPlayers(e.target.value, 'home')
                        }}
                        className="input w-full"
                        required
                      >
                        <option value="">Выберите домашнюю команду</option>
                        {availableClubs.map((club: any) => {
                          const clubSeason = club.seasons?.find(
                            (cs: any) =>
                              cs.season?.toString() === formData.season || cs.season_id?.toString() === formData.season
                          )
                          const groupLabel = clubSeason?.group_name ? ` (${clubSeason.group_name})` : ''
                          return (
                            <option key={club.id} value={club.id.toString()}>
                              {club.name}
                              {groupLabel}
                            </option>
                          )
                        })}
                      </select>
                      {formData.season && groupFilter && availableClubs.length === 0 && (
                        <p className="text-xs text-red-400 mt-1">В этой группе нет команд</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Гостевая команда *</label>
                      <select
                        value={formData.away_team}
                        onChange={(e) => {
                          setFormData({ ...formData, away_team: e.target.value })
                          loadPlayers(e.target.value, 'away')
                        }}
                        className="input w-full"
                        required
                      >
                        <option value="">Выберите гостевую команду</option>
                        {availableClubs.map((club: any) => {
                          const clubSeason = club.seasons?.find(
                            (cs: any) =>
                              cs.season?.toString() === formData.season || cs.season_id?.toString() === formData.season
                          )
                          const groupLabel = clubSeason?.group_name ? ` (${clubSeason.group_name})` : ''
                          return (
                            <option key={club.id} value={club.id.toString()}>
                              {club.name}
                              {groupLabel}
                            </option>
                          )
                        })}
                      </select>
                      {formData.season && groupFilter && availableClubs.length === 0 && (
                        <p className="text-xs text-red-400 mt-1">В этой группе нет команд</p>
                      )}
                    </div>
                  </div>

                  {formData.season && groups.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Фильтр по группе</label>
                      <select
                        value={groupFilter || ''}
                        onChange={(e) => {
                          setGroupFilter(e.target.value || null)
                          setFormData({ ...formData, home_team: '', away_team: '' })
                        }}
                        className="input w-full"
                      >
                        <option value="">Все группы</option>
                        {groups.map((g: any) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-white/60 mt-1">
                        Выберите группу для фильтрации списка команд. Группа матча определится автоматически из групп выбранных
                        команд.
                      </p>
                    </div>
                  )}

                  {formData.home_team && formData.away_team && formData.season && (
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                      <p className="text-sm text-blue-400">
                        <strong>Группа матча:</strong> {matchGroupInfo?.name || 'Определится автоматически из групп команд'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeMatchTab === 'extras' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium mb-1">Статус матча *</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                        className="input w-full"
                        required
                      >
                        {matchStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <div className="text-sm text-white/60">Текущее состояние</div>
                        <div className="text-lg font-semibold">
                          {matchStatusOptions.find((opt) => opt.value === formData.status)?.label || '—'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {homeName} {computedHome} — {computedAway} {awayName}
                        </div>
                        <div className="text-xs text-white/50">Счет обновляется автоматически по событиям</div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-white/60">
                      Для изменения счета и событий используйте вкладку «События». При статусе «Запланирован» счет не отправляется на
                      сервер.
                    </div>
                  </div>
                </div>
              )}

              {activeMatchTab === 'events' && (
                <div className="space-y-6">
                  {!(formData.status === 'live' || formData.status === 'finished') ? (
                    <div className="rounded-xl border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-200">
                      События доступны после смены статуса на «Матч идёт» или «Завершён».
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold">Управление событиями матча</h3>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-white">
                            {homeName} {computedHome} - {computedAway} {awayName}
                          </div>
                          <div className="text-sm text-gray-400">Текущий счет</div>
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                if (!editingMatch) return

                                await (apiClient as any).patch(API_ENDPOINTS.MATCH_DETAIL(editingMatch.id.toString()), {
                                  home_score: 0,
                                  away_score: 0
                                })

                                setFormData({
                                  ...formData,
                                  goals: [],
                                  assists: [],
                                  yellow_cards: [],
                                  red_cards: [],
                                  home_score: 0,
                                  away_score: 0
                                })

                                const updatedMatch = await (apiClient as any).get(
                                  API_ENDPOINTS.MATCH_DETAIL(editingMatch.id.toString())
                                )
                                setEditingMatch(updatedMatch as any)

                                setExistingEvents({ goals: [], cards: [], assists: [], substitutions: [] })

                                window.dispatchEvent(
                                  new CustomEvent('data-refresh', {
                                    detail: {
                                      type: 'match',
                                      id: editingMatch?.id,
                                      action: 'score_reset'
                                    }
                                  })
                                )

                                alert('Счет сброшен')
                              } catch (error) {
                                alert('Не удалось сбросить счет')
                              }
                            }}
                            className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                          >
                            Сбросить счет
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4">
                        <button
                          type="button"
                          onClick={() => addEvent('goals')}
                          className="btn btn-primary flex items-center gap-1 px-3 py-2 text-sm"
                        >
                          <span className="font-bold">+</span>
                          <span>Гол</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => addEvent('assists')}
                          className="btn btn-outline flex items-center gap-1 px-3 py-2 text-sm"
                        >
                          <span className="font-bold">+</span>
                          <span>Ассист</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => addEvent('yellow_cards')}
                          className="btn bg-yellow-600 hover:bg-yellow-700 text-white flex items-center gap-1 px-3 py-2 text-sm"
                        >
                          <span className="font-bold">+</span>
                          <span>Желтая</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => addEvent('red_cards')}
                          className="btn bg-red-600 hover:bg-red-700 text-white flex items-center gap-1 px-3 py-2 text-sm"
                        >
                          <span className="font-bold">+</span>
                          <span>Красная</span>
                        </button>
                      </div>

                      {editingMatch && (existingEvents.goals.length > 0 || existingEvents.cards.length > 0 || existingEvents.assists.length > 0) && (
                        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mb-6">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-blue-400">События из истории матча</h3>
                            <button
                              type="button"
                              onClick={() => setShowHistory(!showHistory)}
                              className="text-sm text-white/70 hover:text-white flex items-center gap-2"
                            >
                              <span>{showHistory ? 'Скрыть' : 'Показать'}</span>
                              <span className={`transition-transform ${showHistory ? 'rotate-180' : ''}`}>▼</span>
                            </button>
                          </div>

                          {showHistory && (
                            <div className="space-y-4">
                              {existingEvents.goals.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-md font-medium text-green-400 mb-2">Голы ({existingEvents.goals.length})</h4>
                                  {existingEvents.goals.map((goal: any, index: number) => (
                                    <div
                                      key={goal.id}
                                      className="flex items-center gap-3 p-3 bg-green-900/20 rounded border border-green-500/30 mb-2"
                                    >
                                      <div className="text-green-400 font-bold">#{index + 1}</div>
                                      <div className="flex-1">
                                        <div className="font-semibold text-white">{goal.scorer_name || 'Неизвестный игрок'}</div>
                                        {goal.assist_name && (
                                          <div className="text-sm text-gray-400">Ассист: {goal.assist_name}</div>
                                        )}
                                        <div className="text-xs text-gray-500">Команда: {goal.team_name}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-green-400">{goal.minute}&apos;</div>
                                        <div className="text-xs text-gray-500">мин</div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => deleteExistingEvent('goal', goal)}
                                        className="ml-2 text-red-400 hover:text-red-300"
                                        title="Удалить гол"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {existingEvents.assists.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-md font-medium text-blue-400 mb-2">Ассисты ({existingEvents.assists.length})</h4>
                                  {existingEvents.assists.map((assist: any, index: number) => (
                                    <div
                                      key={assist.id}
                                      className="flex items-center gap-3 p-3 bg-blue-900/20 rounded border border-blue-500/30 mb-2"
                                    >
                                      <div className="text-blue-400 font-bold">#{index + 1}</div>
                                      <div className="flex-1">
                                        <div className="font-semibold text-white">{assist.player_name || 'Неизвестный игрок'}</div>
                                        <div className="text-xs text-gray-500">Команда: {assist.team_name}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-blue-400">{assist.minute}&apos;</div>
                                        <div className="text-xs text-gray-500">мин</div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => deleteExistingEvent('assist', assist)}
                                        className="ml-2 text-red-400 hover:text-red-300"
                                        title="Удалить ассист"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {existingEvents.cards.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-md font-medium text-yellow-400 mb-2">🟨🟥 Карточки ({existingEvents.cards.length})</h4>
                                  {existingEvents.cards.map((card: any, index: number) => (
                                    <div
                                      key={card.id}
                                      className="flex items-center gap-3 p-3 bg-yellow-900/20 rounded border border-yellow-500/30 mb-2"
                                    >
                                      <div className={card.card_type === 'yellow' ? 'text-yellow-400 text-xl' : 'text-red-400 text-xl'}>
                                        {card.card_type === 'yellow' ? '🟨' : '🟥'}
                                      </div>
                                      <div className="flex-1">
                                        <div className="font-semibold text-white">{card.player_name || 'Неизвестный игрок'}</div>
                                        <div className="text-xs text-gray-500">Команда: {card.team_name}</div>
                                      </div>
                                      <div className="text-center">
                                        <div className="text-lg font-bold text-yellow-400">{card.minute}&apos;</div>
                                        <div className="text-xs text-gray-500">мин</div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => deleteExistingEvent('card', card)}
                                        className="ml-2 text-red-400 hover:text-red-300"
                                        title="Удалить карточку"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Новые голы (из формы) */}
                      {formData.goals.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-lg font-medium text-green-400">➕ Новые голы ({formData.goals.length})</h4>
                          {formData.goals.map((goal, index) => (
                            <div key={goal.id} className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <select
                                value={goal.player_id}
                                onChange={(e) => updateEvent('goals', goal.id, 'player_id', e.target.value)}
                                className="input flex-1"
                              >
                                <option value="">Выберите игрока</option>
                                {(goal.team === 'home' ? homePlayers : awayPlayers).map((player: any) => (
                                  <option key={player.id} value={player.id}>
                                    {player.first_name} {player.last_name} (#{player.number || 'N/A'})
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={goal.minute}
                                onChange={(e) => updateEvent('goals', goal.id, 'minute', parseInt(e.target.value))}
                                placeholder="Минута (1-120)"
                                className="input w-24 text-center"
                                min="1"
                                max="120"
                                title="Введите минуту матча (1-120)"
                              />
                              <select
                                value={goal.team}
                                onChange={(e) => updateEvent('goals', goal.id, 'team', e.target.value)}
                                className="input w-40"
                              >
                                <option value="home">{homeName}</option>
                                <option value="away">{awayName}</option>
                              </select>
                              <button 
                                type="button" 
                                onClick={() => removeEvent('goals', goal.id)} 
                                className="btn bg-red-600 hover:bg-red-700 text-white px-3 py-2"
                              >
                                Удалить
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Ассисты */}
                      {formData.assists.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-lg font-medium text-blue-400">➕ Новые ассисты ({formData.assists.length})</h4>
                          {formData.assists.map((assist, index) => (
                            <div key={assist.id} className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <select
                                value={assist.player_id}
                                onChange={(e) => updateEvent('assists', assist.id, 'player_id', e.target.value)}
                                className="input flex-1"
                              >
                                <option value="">Выберите игрока</option>
                                {(assist.team === 'home' ? homePlayers : awayPlayers).map((player: any) => (
                                  <option key={player.id} value={player.id}>
                                    {player.first_name} {player.last_name} (#{player.number || 'N/A'})
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={assist.minute}
                                onChange={(e) => updateEvent('assists', assist.id, 'minute', parseInt(e.target.value))}
                                placeholder="Минута (1-120)"
                                className="input w-24 text-center"
                                min="1"
                                max="120"
                                title="Введите минуту матча (1-120)"
                              />
                              <select
                                value={assist.team}
                                onChange={(e) => updateEvent('assists', assist.id, 'team', e.target.value)}
                                className="input w-40"
                              >
                                <option value="home">{homeName}</option>
                                <option value="away">{awayName}</option>
                              </select>
                              <button 
                                type="button" 
                                onClick={() => removeEvent('assists', assist.id)} 
                                className="btn bg-red-600 hover:bg-red-700 text-white px-3 py-2"
                              >
                                Удалить
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Желтые карточки */}
                      {formData.yellow_cards.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-lg font-medium text-yellow-400">➕ Новые желтые карточки ({formData.yellow_cards.length})</h4>
                          {formData.yellow_cards.map((card, index) => (
                            <div key={card.id} className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                              <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <select
                                value={card.player_id}
                                onChange={(e) => updateEvent('yellow_cards', card.id, 'player_id', e.target.value)}
                                className="input flex-1"
                              >
                                <option value="">Выберите игрока</option>
                                {(card.team === 'home' ? homePlayers : awayPlayers).map((player: any) => (
                                  <option key={player.id} value={player.id}>
                                    {player.first_name} {player.last_name} (#{player.number || 'N/A'})
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={card.minute}
                                onChange={(e) => updateEvent('yellow_cards', card.id, 'minute', parseInt(e.target.value))}
                                placeholder="Минута (1-120)"
                                className="input w-24 text-center"
                                min="1"
                                max="120"
                                title="Введите минуту матча (1-120)"
                              />
                              <select
                                value={card.team}
                                onChange={(e) => updateEvent('yellow_cards', card.id, 'team', e.target.value)}
                                className="input w-40"
                              >
                                <option value="home">{homeName}</option>
                                <option value="away">{awayName}</option>
                              </select>
                              <button 
                                type="button" 
                                onClick={() => removeEvent('yellow_cards', card.id)} 
                                className="btn bg-red-600 hover:bg-red-700 text-white px-3 py-2"
                              >
                                Удалить
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Красные карточки */}
                      {formData.red_cards.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-lg font-medium text-red-400">➕ Новые красные карточки ({formData.red_cards.length})</h4>
                          {formData.red_cards.map((card, index) => (
                            <div key={card.id} className="flex items-center gap-3 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                {index + 1}
                              </div>
                              <select
                                value={card.player_id}
                                onChange={(e) => updateEvent('red_cards', card.id, 'player_id', e.target.value)}
                                className="input flex-1"
                              >
                                <option value="">Выберите игрока</option>
                                {(card.team === 'home' ? homePlayers : awayPlayers).map((player: any) => (
                                  <option key={player.id} value={player.id}>
                                    {player.first_name} {player.last_name} (#{player.number || 'N/A'})
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                value={card.minute}
                                onChange={(e) => updateEvent('red_cards', card.id, 'minute', parseInt(e.target.value))}
                                placeholder="Минута (1-120)"
                                className="input w-24 text-center"
                                min="1"
                                max="120"
                                title="Введите минуту матча (1-120)"
                              />
                              <select
                                value={card.team}
                                onChange={(e) => updateEvent('red_cards', card.id, 'team', e.target.value)}
                                className="input w-40"
                              >
                                <option value="home">{homeName}</option>
                                <option value="away">{awayName}</option>
                              </select>
                              <button 
                                type="button" 
                                onClick={() => removeEvent('red_cards', card.id)} 
                                className="btn bg-red-600 hover:bg-red-700 text-white px-3 py-2"
                              >
                                Удалить
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Кнопка истории событий - всегда видна если есть история */}
                      {editingMatch && (existingEvents.goals.length > 0 || existingEvents.cards.length > 0 || existingEvents.assists.length > 0) && (
                        <div className="text-center py-4">
                          <button
                            type="button"
                            onClick={() => setShowHistory(!showHistory)}
                            className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 mx-auto"
                          >
                            История матча ({existingEvents.goals.length + existingEvents.cards.length + existingEvents.assists.length} событий)
                            <span className={`transition-transform ${showHistory ? 'rotate-180' : ''}`}>▼</span>
                          </button>
                        </div>
                      )}

                      {/* Пустое состояние */}
                      {formData.goals.length === 0 && formData.assists.length === 0 && formData.yellow_cards.length === 0 && formData.red_cards.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          <div className="text-lg mb-2">События матча</div>
                          <div className="text-sm">Используйте кнопки выше для добавления событий</div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:gap-4 pt-4 border-t border-white/10">
              <button type="submit" className="flex-1 btn btn-primary h-12" disabled={mutationLoading}>
                {mutationLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false)
                  setEditingMatch(null)
                  setExistingEvents({ goals: [], cards: [], assists: [], substitutions: [] })
                  setFormData({
                    date: '',
                    time: '',
                    home_team: '',
                    away_team: '',
                    stadium: '',
                    stadium_ref: '',
                    status: 'scheduled',
                    home_score: undefined,
                    away_score: undefined,
                    season: selectedSeasonId || '',
                    goals: [],
                    assists: [],
                    yellow_cards: [],
                    red_cards: []
                  })
                  setGroupFilter(null)
                  setMatchGroupInfo(null)
                  setActiveMatchTab('schedule')
                }}
                className="flex-1 btn btn-outline h-12"
              >
                Отмена
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setMatchToDelete(null) }}
        onConfirm={confirmDelete}
        title="Подтверждение удаления"
        message={`Вы действительно хотите удалить матч ${matchToDelete?.home_team_name} vs ${matchToDelete?.away_team_name}?`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
        confirmFirst={true}
      />
    </div>
  )
}