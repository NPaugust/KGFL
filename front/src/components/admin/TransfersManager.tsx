"use client"

import { useState } from 'react'
import { useApi, useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Player, Club, PlayerTransfer } from '@/types'
import { Loading } from '@/components/Loading'

export function TransfersManager() {
  const { data: players } = useApi<Player[]>(API_ENDPOINTS.PLAYERS)
  const { data: clubs } = useApi<Club[]>(API_ENDPOINTS.CLUBS)
  const { data: transfers, loading, refetch } = useApi<PlayerTransfer[]>(API_ENDPOINTS.PLAYER_TRANSFERS)
  const { mutate, loading: saving } = useApiMutation<PlayerTransfer>()

  const [form, setForm] = useState<{ player: string; from_club?: string; to_club: string; transfer_date: string; status: 'confirmed' | 'pending' | 'cancelled' }>(
    { player: '', from_club: '', to_club: '', transfer_date: new Date().toISOString().slice(0,10), status: 'confirmed' }
  )

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    await mutate(API_ENDPOINTS.PLAYER_TRANSFERS, 'POST', form)
    setForm({ player: '', from_club: '', to_club: '', transfer_date: new Date().toISOString().slice(0,10), status: 'confirmed' })
    refetch()
  }

  if (loading) return <Loading />

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Трансферы</h1>
      </div>

      <div className="card p-4 mb-6">
        <h3 className="text-lg font-semibold mb-3">Новый трансфер</h3>
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select value={form.player} onChange={e=>setForm({...form, player:e.target.value})} className="input" required>
            <option value="">Игрок</option>
            {Array.isArray(players) && players.map(p => (
              <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
            ))}
          </select>
          <select value={form.from_club || ''} onChange={e=>setForm({...form, from_club:e.target.value||undefined})} className="input">
            <option value="">Свободный агент / из клуба</option>
            {Array.isArray(clubs) && clubs.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={form.to_club} onChange={e=>setForm({...form, to_club:e.target.value})} className="input" required>
            <option value="">В клуб</option>
            {Array.isArray(clubs) && clubs.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input type="date" value={form.transfer_date} onChange={e=>setForm({...form, transfer_date:e.target.value})} className="input" required />
          <div className="flex gap-2">
            <select value={form.status} onChange={e=>setForm({...form, status:e.target.value as any})} className="input">
              <option value="confirmed">Подтвержден</option>
              <option value="pending">Ожидание</option>
              <option value="cancelled">Отменен</option>
            </select>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Сохранение...' : 'Добавить'}</button>
          </div>
        </form>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Игрок</th>
                <th className="px-4 py-3 text-left">Из</th>
                <th className="px-4 py-3 text-left">В</th>
                <th className="px-4 py-3 text-left">Дата</th>
                <th className="px-4 py-3 text-left">Статус</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(transfers) && transfers.map(t => (
                <tr key={t.id} className="border-b border-white/10">
                  <td className="px-4 py-3">{typeof t.player === 'object' ? `${t.player.first_name} ${t.player.last_name}` : t.player}</td>
                  <td className="px-4 py-3">{typeof t.from_club === 'object' ? t.from_club?.name : (t.from_club || 'Свободный агент')}</td>
                  <td className="px-4 py-3">{typeof t.to_club === 'object' ? t.to_club?.name : t.to_club}</td>
                  <td className="px-4 py-3">{new Date(t.transfer_date).toLocaleDateString('ru-RU')}</td>
                  <td className="px-4 py-3">{t.status === 'confirmed' ? 'Подтвержден' : t.status === 'pending' ? 'Ожидание' : 'Отменен'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
