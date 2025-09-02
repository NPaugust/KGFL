import { create } from 'zustand'

export type Season = {
  id: string
  name: string
}

type State = {
  seasons: Season[]
  selectedSeasonId: string
  setSeason: (id: string) => void
}

const initialSeasons: Season[] = [
  { id: '2024', name: 'Сезон 2024' },
  { id: '2023', name: 'Сезон 2023' },
  { id: '2022', name: 'Сезон 2022' }
]

export const useSeasonStore = create<State>((set) => ({
  seasons: initialSeasons,
  selectedSeasonId: initialSeasons[0].id,
  setSeason: (id) => set({ selectedSeasonId: id }),
}))


