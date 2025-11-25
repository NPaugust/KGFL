"use client"
import { useEffect, useMemo, useState } from 'react'
import { useApi } from '@/hooks/useApi'
import { useApiMutation } from '@/hooks/useApi'
import { API_ENDPOINTS } from '@/services/api'
import { Loading } from '../Loading'
import Image from 'next/image'
import { Modal, ConfirmModal } from '../ui/Modal'
import { Media } from '@/types'
import { getImageUrl } from '@/utils'
import { PaginationControls, DEFAULT_PAGE_SIZE } from './PaginationControls'

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

const ITEMS_PER_PAGE = DEFAULT_PAGE_SIZE

export function MediaManager() {
  const { data: media, loading, refetch } = useApi<Media[]>(API_ENDPOINTS.MEDIA)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editing, setEditing] = useState<Media | null>(null)
  const [toDelete, setToDelete] = useState<Media | null>(null)
  const [formData, setFormData] = useState<MediaFormData>(initialFormData)
  const [activeMediaTab, setActiveMediaTab] = useState<'content' | 'files' | 'settings'>('content')
  const [currentPage, setCurrentPage] = useState(1)

  const { mutate, loading: mutationLoading } = useApiMutation()
  const mediaModalTabs: { id: 'content' | 'files' | 'settings'; label: string; description: string }[] = [
    { id: 'content', label: 'Контент', description: 'Название и описание' },
    { id: 'files', label: 'Файлы/ссылки', description: 'Загрузка или URL' },
    { id: 'settings', label: 'Настройки', description: 'Тип и активность' }
  ]

  const handleCreateClick = () => {
    setEditing(null);
    setFormData(initialFormData);
    setActiveMediaTab('content')
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
    setActiveMediaTab('content')
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
      alert('Не удалось сохранить медиа.')
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
      alert('Не удалось удалить медиа.');
    }
  };

  const list = useMemo(() => Array.isArray(media) ? media : [], [media])
  const totalMediaItems = list.length
  const totalMediaPages = Math.max(1, Math.ceil(totalMediaItems / ITEMS_PER_PAGE))
  const safeMediaPage = Math.min(currentPage, totalMediaPages)

  useEffect(() => {
    if (currentPage !== safeMediaPage) {
      setCurrentPage(safeMediaPage)
    }
  }, [currentPage, safeMediaPage])

  const paginatedMedia = useMemo(() => {
    const startIndex = (safeMediaPage - 1) * ITEMS_PER_PAGE
    return list.slice(startIndex, startIndex + ITEMS_PER_PAGE)
  }, [list, safeMediaPage])

  if (loading) return <Loading />

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
              {paginatedMedia.length > 0 ? paginatedMedia.map((item) => (
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
              )) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-white/60">
                    {list.length === 0 ? 'Медиа не найдены' : 'Нет результатов для текущей страницы'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <PaginationControls
        page={safeMediaPage}
        pageSize={ITEMS_PER_PAGE}
        totalItems={totalMediaItems}
        onPageChange={setCurrentPage}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditing(null)
          setFormData(initialFormData)
          setActiveMediaTab('content')
        }}
        title={editing ? 'Редактировать медиа' : 'Добавить медиа'}
        size="lg"
        className="max-w-4xl"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 p-1">
          <div className="flex flex-wrap gap-2">
            {mediaModalTabs.map((tab) => {
              const isActive = activeMediaTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveMediaTab(tab.id)}
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
            {activeMediaTab === 'content' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Название *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input w-full"
                    required
                    placeholder="Например: Фото с матча"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Описание</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="textarea w-full"
                    rows={4}
                    placeholder="Краткое описание материала"
                  />
                </div>
              </div>
            )}

            {activeMediaTab === 'files' && (
              <div className="space-y-5">
                {formData.media_type === 'image' && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Файл изображения</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] })}
                      className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30"
                    />
                  </div>
                )}

                {['video', 'document'].includes(formData.media_type) && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">URL *</label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="input w-full"
                        required
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Превью (необязательно)</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setFormData({ ...formData, preview: e.target.files?.[0] })}
                        className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30"
                      />
                      <p className="text-xs text-white/60 mt-1">Загрузите изображение превью для видео или документа.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeMediaTab === 'settings' && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium mb-1">Тип медиа *</label>
                  <select
                    value={formData.media_type}
                    onChange={(e) => setFormData({ ...formData, media_type: e.target.value as MediaFormData['media_type'] })}
                    className="input w-full"
                    required
                  >
                    {Object.entries(mediaTypeMap).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                  Активно
                </label>
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
                setEditing(null)
                setFormData(initialFormData)
                setActiveMediaTab('content')
              }}
              className="flex-1 btn btn-outline h-12"
            >
              Отмена
            </button>
          </div>
        </form>
      </Modal>

      {toDelete && (
        <ConfirmModal
          isOpen={!!toDelete}
          onClose={() => setToDelete(null)}
          onConfirm={confirmDelete}
          title="Удалить медиа?"
          message={`Вы уверены, что хотите удалить "${toDelete.title}"?`}
          variant="danger"
          confirmFirst={true}
        />
      )}
    </div>
  )
}