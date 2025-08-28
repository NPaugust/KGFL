"use client"
import { useSeasonStore } from '@/store/useSeasonStore'
import { SelectMenu } from './Filters'

export function SeasonFilter() {
  const { seasons, selectedSeasonId, setSeason } = useSeasonStore()
  return (
    <SelectMenu
      label="Сезон"
      value={selectedSeasonId}
      onChange={setSeason}
      options={seasons.map((s) => ({ label: s.name, value: s.id }))}
    />
  )
}


