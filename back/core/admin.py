from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Season, Partner, Media


@admin.register(User)
class UserAdmin(BaseUserAdmin):
	"""Админ-панель для модели User."""
	
	list_display = ['username', 'email', 'first_name', 'last_name', 'is_admin', 'is_active', 'created_at']
	list_filter = ['is_active', 'is_staff', 'created_at']
	search_fields = ['username', 'email', 'first_name', 'last_name']
	ordering = ['-created_at']
	
	fieldsets = BaseUserAdmin.fieldsets + (
		('KGFL Информация', {
			'fields': ('phone', 'avatar', 'bio')
		}),
	)
	
	add_fieldsets = BaseUserAdmin.add_fieldsets + (
		('KGFL Информация', {
			'fields': ('phone', 'avatar', 'bio')
		}),
	)


@admin.register(Season)
class SeasonAdmin(admin.ModelAdmin):
	"""Админ-панель для модели Season."""
	
	list_display = ['name', 'start_date', 'end_date', 'is_active', 'created_at']
	list_filter = ['is_active', 'start_date', 'end_date']
	search_fields = ['name', 'description']
	ordering = ['-start_date']
	
	fieldsets = (
		('Основная информация', {
			'fields': ('name', 'description')
		}),
		('Даты', {
			'fields': ('start_date', 'end_date')
		}),
		('Статус', {
			'fields': ('is_active',)
		}),
	)


@admin.register(Partner)
class PartnerAdmin(admin.ModelAdmin):
	"""Админ-панель для модели Partner."""
	
	list_display = ['name', 'category', 'is_active', 'order', 'created_at']
	list_filter = ['category', 'is_active', 'created_at']
	search_fields = ['name']
	ordering = ['order', 'name']
	
	fieldsets = (
		('Основная информация', {
			'fields': ('name', 'category')
		}),
		('Медиа', {
			'fields': ('logo', 'website')
		}),
		('Настройки', {
			'fields': ('is_active', 'order')
		}),
	)


@admin.register(Media)
class MediaAdmin(admin.ModelAdmin):
	"""Админ-панель для модели Media."""
	
	list_display = ['title', 'media_type', 'is_active', 'created_at']
	list_filter = ['media_type', 'is_active', 'created_at']
	search_fields = ['title', 'description']
	ordering = ['-created_at']
	
	def preview_display(self, obj):
		if obj.preview:
			return f'<img src="{obj.preview.url}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;" />'
		return "Нет превью"
	preview_display.allow_tags = True
	preview_display.short_description = "Превью"
	
	fieldsets = (
		('Основная информация', {
			'fields': ('title', 'description', 'media_type')
		}),
		('Файлы', {
			'fields': ('file', 'url', 'preview', 'preview_display')
		}),
		('Настройки', {
			'fields': ('is_active',)
		}),
	)
	readonly_fields = ['preview_display']




 