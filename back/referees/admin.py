from django.contrib import admin
from .models import Referee


@admin.register(Referee)
class RefereeAdmin(admin.ModelAdmin):
	"""Админ-панель для модели Referee."""
	
	list_display = ['first_name', 'last_name', 'category', 'region', 'experience_months', 'phone', 'is_active']
	list_filter = ['category', 'region', 'is_active']
	search_fields = ['first_name', 'last_name', 'region', 'phone']
	ordering = ['last_name', 'first_name']
	
	def photo_preview(self, obj):
		if obj.photo:
			return f'<img src="{obj.photo.url}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;" />'
		return "Нет фото"
	photo_preview.allow_tags = True
	photo_preview.short_description = "Фото"
	
	fieldsets = (
		('Личная информация', {
			'fields': ('first_name', 'last_name', 'date_of_birth', 'nationality')
		}),
		('Категория и регион', {
			'fields': ('category', 'region', 'experience_months')
		}),
		('Контакты', {
			'fields': ('phone',)
		}),
		('Медиа', {
			'fields': ('photo', 'photo_preview')
		}),
		('Статус', {
			'fields': ('is_active',)
		}),
	)
	
	readonly_fields = ['age'] 