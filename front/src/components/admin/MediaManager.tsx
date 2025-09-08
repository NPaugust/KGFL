"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import Image from 'next/image'
import { Modal, ConfirmModal } from '../ui/Modal'

interface MediaFormData {
  title: string
  description: string
  media_type: string
  file?: File
  url: string
  is_active: boolean
}

export function MediaManager() {
  const { data: media, loading, error, refetch } = useApi<any[]>(API_ENDPOINTS.MEDIA)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMedia, setEditingMedia] = useState<any | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [mediaToDelete, setMediaToDelete] = useState<any | null>(null)
  const [formData, setFormData] = useState<MediaFormData>({
    title: '',
    description: '',
    media_type: 'image',
    url: '',
    is_active: true
  })

  const { mutate, loading: mutationLoading } = useApiMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload = new FormData()
      payload.append('title', formData.title)
      payload.append('description', formData.description || '')
      payload.append('media_type', formData.media_type)
      payload.append('url', formData.url || '')
      payload.append('is_active', String(formData.is_active))
      if (formData.file) payload.append('file', formData.file)

      if (editingMedia) {
        await mutate(API_ENDPOINTS.MEDIA_DETAIL(editingMedia.id), 'PUT', payload)
      } else {
        await mutate(API_ENDPOINTS.MEDIA, 'POST', payload)
      }

      setIsModalOpen(false)
      setEditingMedia(null)
      
      // Сбрасываем formData только при создании нового медиа
      if (!editingMedia) {
        setFormData({
          title: '',
          description: '',
          media_type: 'image',
          url: '',
          is_active: true
        })
      }
      refetch()
      
      // Отправляем событие обновления данных
      window.dispatchEvent(new CustomEvent('data-refresh', { 
        detail: { type: 'media' } 
      }))
    } catch (error) {
      console.error('Ошибка при сохранении медиа:', error)
      alert('Ошибка при сохранении медиа')
    }
  }

  const handleEdit = (mediaItem: any) => {
    setEditingMedia(mediaItem)
    setFormData({
      title: mediaItem.title || '',
      description: mediaItem.description || '',
      media_type: mediaItem.media_type || 'image',
      url: mediaItem.url || '',
      is_active: mediaItem.is_active !== false,
      file: undefined // Файл не префиллим при редактировании
    })
    setIsModalOpen(true)
  }

  const handleDelete = (mediaItem: any) => {
    setMediaToDelete(mediaItem)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!mediaToDelete) return
    
    try {
      await mutate(API_ENDPOINTS.MEDIA_DETAIL(mediaToDelete.id), 'DELETE')
      refetch()
      setDeleteModalOpen(false)
      setMediaToDelete(null)
      alert('Медиа-файл успешно удален!')
    } catch (error: any) {
      alert(`Ошибка при удалении медиа: ${error?.response?.data?.detail || error?.message || 'Неизвестная ошибка'}`)
    }
  }

  if (loading) {
    return <Loading />
  }

  const mediaList = Array.isArray(media) ? media : []

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Управление медиа</h1>
        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">Добавить медиа</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Превью</th>
                <th className="px-4 py-3 text-left">Название</th>
                <th className="px-4 py-3 text-left">Тип</th>
                <th className="px-4 py-3 text-left">URL</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {mediaList.length > 0 ? mediaList.map((mediaItem) => (
                <tr key={mediaItem.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {mediaItem.media_type === 'image' && ((mediaItem as any).image_url || mediaItem.file_url || mediaItem.url) ? (
                      <Image 
                        src={(mediaItem as any).image_url || mediaItem.file_url || mediaItem.url} 
                        alt={mediaItem.title} 
                        width={48} 
                        height={48} 
                        className="w-12 h-12 rounded object-cover" 
                      />
                    ) : (
                      <div className="w-12 h-12 bg-white/10 rounded flex items-center justify-center text-xs">
                        {mediaItem.media_type === 'video' ? '🎥' : '📄'}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{mediaItem.title}</td>
                  <td className="px-4 py-3">{mediaItem.media_type}</td>
                  <td className="px-4 py-3">{mediaItem.url || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      mediaItem.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                    }`}>
                      {mediaItem.is_active ? 'Активно' : 'Неактивно'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(mediaItem)} className="btn btn-outline px-3 py-1 text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(mediaItem)} className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-white/60">Медиа-файлы не найдены</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingMedia(null); }}
        title={editingMedia ? 'Редактировать медиа' : 'Добавить медиа'}
        size="md"
      >
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название *</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input w-full" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="textarea w-full" rows={3} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Тип медиа *</label>
                <select value={formData.media_type} onChange={(e) => setFormData({ ...formData, media_type: e.target.value })} className="input w-full" required>
                  <option value="image">Изображение</option>
                  <option value="video">Видео</option>
                  <option value="document">Документ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">URL</label>
                <input type="url" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="input w-full" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Файл {editingMedia ? '' : '*'}</label>
                <input type="file" accept="image/*,video/*,.pdf,.doc,.docx" onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] })} className="input w-full" required={!editingMedia} />
              </div>

              <div>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} />
                  <span className="text-sm">Активно</span>
                </label>
              </div>

            <div className="flex gap-3 pt-4">
              <button type="submit" className="btn btn-primary flex-1" disabled={mutationLoading}>
                {mutationLoading ? 'Сохранение...' : 'Сохранить'}
              </button>
              <button type="button" onClick={() => { setIsModalOpen(false); setEditingMedia(null); }} className="btn btn-outline flex-1">
                Отмена
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setMediaToDelete(null) }}
        onConfirm={confirmDelete}
        title="Подтверждение удаления"
        message={`Вы действительно хотите удалить медиа-файл "${mediaToDelete?.title}"?`}
        confirmText="Да, удалить"
        cancelText="Отмена"
        variant="danger"
      />
    </div>
  )
}