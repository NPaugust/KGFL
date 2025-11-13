"use client"
import { useState, useEffect } from 'react'
import { useApi } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { useSeasonStore } from '@/store/useSeasonStore'
import { SelectMenu } from './Filters'

interface Group {
  id: string
  name: string
  order: number
  clubs_count: number
}

export function GroupFilter() {
  const { selectedSeasonId, selectedGroupId, setGroup } = useSeasonStore()
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)

  // Загружаем группы для выбранного сезона
  const groupsUrl = selectedSeasonId && selectedSeasonId.trim() !== '' 
    ? API_ENDPOINTS.SEASON_GROUPS(selectedSeasonId)
    : null
  
  const { data: groupsData, loading: groupsLoading } = useApi<any>(
    groupsUrl,
    undefined,
    [selectedSeasonId]
  )

  useEffect(() => {
    if (groupsData) {
      if (Array.isArray(groupsData)) {
        setGroups(groupsData)
      } else if (groupsData.results && Array.isArray(groupsData.results)) {
        setGroups(groupsData.results)
      } else {
        setGroups([])
      }
    } else {
      setGroups([])
    }
    setLoading(groupsLoading)
  }, [groupsData, groupsLoading])

  // Если сезон не выбран или нет групп - не показываем фильтр
  if (!selectedSeasonId || selectedSeasonId.trim() === '' || groups.length === 0) {
    return null
  }

  return (
    <SelectMenu
      label="Группа"
      value={selectedGroupId || ''}
      onChange={(id) => setGroup(id || null)}
      options={[
        { label: 'Все группы', value: '' },
        ...groups.map((g) => ({ label: g.name, value: g.id }))
      ]}
    />
  )
}

