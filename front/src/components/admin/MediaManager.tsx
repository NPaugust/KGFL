"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import { apiClient } from '@/services/api'
import { getImageUrl } from '@/utils'

export function MediaManager() {
  const { data: media, loading, refetch } = useApi(API_ENDPOINTS.MEDIA)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMedia, setEditingMedia] = useState<any>(null)
  const [file, setFile] = useState<File | null>(null)

  const createMediaMutation = useApiMutation()
  const updateMediaMutation = useApiMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file && !editingMedia) return
    try {
      const formDataToSend = new FormData()
      if (file) formDataToSend.append('image', file)

      if (editingMedia) {
        await updateMediaMutation.mutateAsync(API_ENDPOINTS.MEDIA_DETAIL(editingMedia.id), 'PUT', formDataToSend)
      } else {
        await createMediaMutation.mutateAsync(API_ENDPOINTS.MEDIA, 'POST', formDataToSend)
      }

      setIsModalOpen(false)
      setEditingMedia(null)
      setFile(null)
      refetch()
    } catch (error) {
      alert(`Ошибка при сохранении медиа`)
    }
  }

  const handleEdit = (m: any) => {
    setEditingMedia(m)
    setIsModalOpen(true)
  }

  const handleDelete = async (mediaId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот файл?')) {
      try {
        await apiClient.delete(API_ENDPOINTS.MEDIA_DETAIL(mediaId))
        refetch()
      } catch (error) {
        alert('Ошибка при удалении медиа')
      }
    }
  }

  if (loading) {
    return <Loading />
  }

  const mediaList = Array.isArray(media) ? media : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление медиа</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">Добавить медиа</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Изображение</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {mediaList.length > 0 ? mediaList.map((m: any) => (
                <tr key={m.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {m.image_url ? (
                      <img src={getImageUrl(m.image_url)} alt="media" className="w-20 h-20 object-cover rounded" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-500 rounded" />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(m)} className="btn btn-outline px-3 py-1 text-sm">Заменить</button>
                      <button onClick={() => handleDelete(m.id)} className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-white/60">Медиа файлы не найдены</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editingMedia ? 'Заменить изображение' : 'Добавить изображение'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded" />
              </div>
              <div className="flex gap-2 pt-4">
                <button type="submit" className="btn btn-primary flex-1" disabled={createMediaMutation.loading || updateMediaMutation.loading}>{createMediaMutation.loading || updateMediaMutation.loading ? 'Сохранение...' : 'Сохранить'}</button>
                <button type="button" onClick={() => { setIsModalOpen(false); setEditingMedia(null); setFile(null) }} className="btn btn-outline flex-1">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 