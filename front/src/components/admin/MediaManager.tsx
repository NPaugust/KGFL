"use client"
import { useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import Image from 'next/image'
import { apiClient } from '@/services/api'

interface MediaFormData {
  title: string
  description: string
  category: string
  image?: File
}

export function MediaManager() {
  const { data: media, loading, refetch } = useApi(API_ENDPOINTS.MEDIA)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMedia, setEditingMedia] = useState<any>(null)
  const [formData, setFormData] = useState<MediaFormData>({
    title: '',
    description: '',
    category: 'gallery'
  })

  const createMediaMutation = useApiMutation()
  const updateMediaMutation = useApiMutation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      console.log('Submitting media data:', formData)
      
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('description', formData.description)
      formDataToSend.append('category', formData.category)
      if (formData.image) {
        formDataToSend.append('image', formData.image)
      } else if (!editingMedia) {
        // Если изображение не выбрано и это создание нового медиа
        console.error('Изображение обязательно для загрузки')
        alert('Пожалуйста, выберите изображение')
        return
      }

      if (editingMedia) {
        console.log('Updating media:', editingMedia.id)
        await updateMediaMutation.mutateAsync(API_ENDPOINTS.MEDIA_DETAIL(editingMedia.id), 'PUT', formDataToSend)
      } else {
        console.log('Creating new media')
        await createMediaMutation.mutateAsync(API_ENDPOINTS.MEDIA, 'POST', formDataToSend)
      }

      setIsModalOpen(false)
      setEditingMedia(null)
      setFormData({ title: '', description: '', category: 'gallery' })
      
      // Принудительно обновляем данные
      setTimeout(() => {
        refetch()
      }, 500)
    } catch (error) {
      console.error('Ошибка при сохранении медиа:', error)
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
      alert(`Ошибка при сохранении медиа: ${errorMessage}`)
    }
  }

  const handleEdit = (media: any) => {
    console.log('Редактируем медиа:', media)
    setEditingMedia(media)
    setFormData({
      title: media.title,
      description: media.description || '',
      category: media.category
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (mediaId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот файл?')) {
      try {
        console.log('Deleting media:', mediaId)
        const response = await apiClient.delete(API_ENDPOINTS.MEDIA_DETAIL(mediaId))
        console.log('Медиа удалено:', response)
        refetch()
      } catch (error) {
        console.error('Ошибка при удалении медиа:', error)
        const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка'
        alert(`Ошибка при удалении медиа: ${errorMessage}`)
      }
    }
  }

  if (loading) {
    return <Loading />
  }

  const mediaList = Array.isArray(media) ? media : []
  console.log('Media list:', mediaList)

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление медиа</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary"
        >
          Добавить медиа
        </button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Изображение</th>
                <th className="px-4 py-3 text-left">Название</th>
                <th className="px-4 py-3 text-left">Описание</th>
                <th className="px-4 py-3 text-left">Категория</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {mediaList.length > 0 ? mediaList.map((media) => (
                <tr key={media.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {media.image_url ? (
                      <img src={media.image_url} alt={media.title} className="w-12 h-12 object-cover rounded" />
                    ) : (
                      <div className="w-12 h-12 bg-gray-500 rounded flex items-center justify-center text-xs">
                        Нет фото
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{media.title}</td>
                  <td className="px-4 py-3">{media.description || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      media.category === 'gallery' ? 'bg-blue-500/20 text-blue-400' :
                      media.category === 'news' ? 'bg-green-500/20 text-green-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {media.category === 'gallery' ? 'Галерея' :
                       media.category === 'news' ? 'Новости' :
                       media.category}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(media)}
                        className="btn btn-outline px-3 py-1 text-sm"
                      >
                        Редактировать
                      </button>
                      <button
                        onClick={() => handleDelete(media.id)}
                        className="btn bg-red-500 hover:bg-red-600 px-3 py-1 text-sm"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/60">
                    Медиа файлы не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно для добавления/редактирования */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingMedia ? 'Редактировать медиа' : 'Добавить медиа'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Название</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Категория</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  required
                >
                  <option value="gallery">Галерея</option>
                  <option value="news">Новости</option>
                  <option value="other">Другое</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">
                  {editingMedia ? 'Новое изображение (необязательно)' : 'Изображение'}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] })}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded"
                  required={!editingMedia}
                />
                {editingMedia && editingMedia.image_url && (
                  <div className="mt-2">
                    <p className="text-sm text-white/60 mb-2">Текущее изображение:</p>
                    <img src={editingMedia.image_url} alt={editingMedia.title} className="w-20 h-20 object-cover rounded" />
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={createMediaMutation.loading || updateMediaMutation.loading}
                >
                  {createMediaMutation.loading || updateMediaMutation.loading ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setEditingMedia(null)
                    setFormData({ title: '', description: '', category: 'gallery' })
                  }}
                  className="btn btn-outline flex-1"
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 