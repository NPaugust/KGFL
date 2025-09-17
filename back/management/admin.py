from django.contrib import admin
from .models import Manager


@admin.register(Manager)
class ManagerAdmin(admin.ModelAdmin):
	"""Админ-панель для модели Manager."""
	
	list_display = ['first_name', 'last_name', 'position', 'email', 'phone', 'is_active', 'order']
	list_filter = ['position', 'is_active', 'created_at']
	search_fields = ['first_name', 'last_name', 'position', 'email', 'phone']
	ordering = ['order', 'last_name', 'first_name']
	
	def photo_preview(self, obj):
		if obj.photo:
			return f'<img src="{obj.photo.url}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;" />'
		return "Нет фото"
	photo_preview.allow_tags = True
	photo_preview.short_description = "Фото"
	
	fieldsets = (
		('Личная информация', {
			'fields': ('first_name', 'last_name', 'position')
		}),
		('Контакты', {
			'fields': ('email', 'phone')
		}),
		('Медиа', {
			'fields': ('photo', 'photo_preview')
		}),
		('Дополнительно', {
			'fields': ('notes',)
		}),
		('Настройки', {
			'fields': ('is_active', 'order')
		}),
	)