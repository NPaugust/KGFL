from django.contrib import admin
from .models import Manager


@admin.register(Manager)
class ManagerAdmin(admin.ModelAdmin):
	"""Админ-панель для модели Manager."""
	
	list_display = ['first_name', 'last_name', 'position', 'email', 'phone', 'is_active', 'order']
	list_filter = ['position', 'is_active', 'created_at']
	search_fields = ['first_name', 'last_name', 'position', 'email', 'phone']
	ordering = ['order', 'last_name', 'first_name']
	
	fieldsets = (
		('Личная информация', {
			'fields': ('first_name', 'last_name', 'position')
		}),
		('Контакты', {
			'fields': ('email', 'phone')
		}),
		('Медиа', {
			'fields': ('photo',)
		}),
		('Дополнительно', {
			'fields': ('bio',)
		}),
		('Настройки', {
			'fields': ('is_active', 'order')
		}),
	)