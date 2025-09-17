"use client"
import { useState, useEffect } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import Image from 'next/image'
import { Modal, ConfirmModal } from '../ui/Modal'
import { Media } from '@/types'
import { getImageUrl } from '@/utils'

// Восстанавливаем интерфейс формы в соответствии с ТЗ
interface MediaFormData {
  title: string
  description: string
  media_type: 'image' | 'video' | 'document'
  url: string
  is_active: boolean
  file?: File
  preview?: File
}

const initialFormData: MediaFormData = {
  title: '',
  description: '',
  media_type: 'image',
  url: '',
  is_active: true,
  file: undefined,
  preview: undefined,
};

const mediaTypeMap = {
  image: 'Изображение',
  video: 'Видео (ссылка)',
  document: 'Документ (ссылка)',
};

export function MediaManager() {
  const { data: media, loading, refetch } = useApi<Media[]>(API_ENDPOINTS.MEDIA)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Media | null>(null)
  const [toDelete, setToDelete] = useState<Media | null>(null)
  const [formData, setFormData] = useState<MediaFormData>(initialFormData)

  const { mutate, loading: mutationLoading } = useApiMutation()

  const handleCreateClick = () => {
    setEditing(null);
    setFormData(initialFormData);
    setIsModalOpen(true);
  };

  const handleEditClick = (mediaItem: Media) => {
    setEditing(mediaItem);
    setFormData({
      title: mediaItem.title || '',
      description: mediaItem.description || '',
      media_type: (mediaItem.media_type as 'image' | 'video' | 'document') || 'image',
      url: mediaItem.url || '',
      is_active: mediaItem.is_active !== false,
      file: undefined,
      preview: undefined,
    });
    setIsModalOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      
      // Явно добавляем все поля из formData в payload
      payload.append('title', formData.title);
      payload.append('description', formData.description || '');
      payload.append('media_type', formData.media_type);
      payload.append('url', formData.url || '');
      payload.append('is_active', String(formData.is_active));

      if (formData.file instanceof File) {
        payload.append('file', formData.file);
      }
      
      if (formData.preview instanceof File) {
        payload.append('preview', formData.preview);
      }
      
      if (editing) {
        await mutate(API_ENDPOINTS.MEDIA_DETAIL(editing.id), 'PATCH', payload);
      } else {
        await mutate(API_ENDPOINTS.MEDIA, 'POST', payload);
      }
      setIsModalOpen(false);
      setEditing(null);
      setFormData(initialFormData);
      refetch();
    } catch (error) {
      console.error("Ошибка при сохранении медиа:", error);
      alert('Не удалось сохранить медиа.');
    }
  };

  const handleDelete = (media: Media) => {
    setToDelete(media);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await mutate(API_ENDPOINTS.MEDIA_DETAIL(toDelete.id), 'DELETE');
      setToDelete(null);
      refetch();
    } catch (error) {
      console.error("Ошибка при удалении медиа:", error);
      alert('Не удалось удалить медиа.');
    }
  };

  if (loading) return <Loading />

  const list = Array.isArray(media) ? media : [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление медиа</h1>
        <button onClick={handleCreateClick} className="btn btn-primary">Добавить медиа</button>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-4 py-3 text-left">Превью</th>
                <th className="px-4 py-3 text-left">Название</th>
                <th className="px-4 py-3 text-left">Описание</th>
                <th className="px-4 py-3 text-left">Тип</th>
                <th className="px-4 py-3 text-left">URL</th>
                <th className="px-4 py-3 text-left">Статус</th>
                <th className="px-4 py-3 text-left">Действия</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    {item.media_type === 'image' && (item as any).file_url ? 
                      <Image src={getImageUrl((item as any).file_url)} alt={item.title} width={40} height={40} className="w-10 h-10 object-cover rounded" /> : 
                      <div className="w-10 h-10 bg-white/5 rounded flex items-center justify-center text-xs">
                        {item.media_type === 'video' ? 'VID' : 'DOC'}
                      </div>
                    }
                  </td>
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3 text-sm text-white/70">{item.description || '-'}</td>
                  <td className="px-4 py-3">{mediaTypeMap[item.media_type as keyof typeof mediaTypeMap] || item.media_type}</td>
                  <td className="px-4 py-3">{item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="link">Ссылка</a> : '-'}</td>
                  <td className="px-4 py-3">
                     <span className={`px-2 py-1 rounded text-xs ${item.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                      {item.is_active ? 'Активно' : 'Неактивно'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditClick(item)} className="btn btn-outline text-sm">Редактировать</button>
                      <button onClick={() => handleDelete(item)} className="btn bg-red-500/80 text-white text-sm">Удалить</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Редактировать медиа' : 'Добавить медиа'}>
        <form onSubmit={handleSubmit} className="space-y-4 p-1">
          <input type="text" placeholder="Название *" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="input w-full" required />
          
          <select value={formData.media_type} onChange={(e) => setFormData({ ...formData, media_type: e.target.value as MediaFormData['media_type'] })} className="input w-full">
            {Object.entries(mediaTypeMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
          </select>
          

          <textarea placeholder="Описание" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="textarea w-full" />
          
          {formData.media_type === 'image' && (
            <div>
              <label className="text-sm">Файл (для изображения)</label>
              <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] })} className="input w-full" />
            </div>
          )}

          {['video', 'document'].includes(formData.media_type) && (
            <>
              <input type="url" placeholder="URL *" value={formData.url} onChange={(e) => setFormData({ ...formData, url: e.target.value })} className="input w-full" required />
              <div>
                <label className="text-sm">Превью (необязательно)</label>
                <input type="file" accept="image/*" onChange={(e) => setFormData({ ...formData, preview: e.target.files?.[0] })} className="input w-full" />
                <p className="text-xs text-white/60 mt-1">Загрузите изображение для превью видео или документа</p>
              </div>
            </>
          )}

          <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} /> Активно</label>
          
          <div className="flex gap-3 pt-4 border-t border-white/10">
            <button type="submit" className="btn btn-primary flex-1" disabled={mutationLoading}>{mutationLoading ? 'Сохранение...' : 'Сохранить'}</button>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-outline flex-1">Отмена</button>
          </div>
        </form>
      </Modal>

      {toDelete && <ConfirmModal isOpen={!!toDelete} onClose={() => setToDelete(null)} onConfirm={confirmDelete} title="Удалить медиа?" message={`Вы уверены, что хотите удалить "${toDelete.title}"?`} variant="danger" confirmFirst={true} />}
    </div>
  )
}