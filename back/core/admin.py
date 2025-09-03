from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Season, Partner, Media, Referee, Management


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
	
	list_display = ['title', 'category', 'is_active', 'order', 'created_at']
	list_filter = ['category', 'is_active', 'created_at']
	search_fields = ['title']
	ordering = ['order', '-created_at']
	
	fieldsets = (
		('Основная информация', {
			'fields': ('title', 'category')
		}),
		('Медиа', {
			'fields': ('image',)
		}),
		('Настройки', {
			'fields': ('is_active', 'order')
		}),
	)


@admin.register(Referee)
class LegacyRefereeAdmin(admin.ModelAdmin):
	"""Старый раздел Referee из core (оставляем для совместимости, но можно скрыть в будущем)."""
	
	list_display = ['name', 'position', 'experience', 'is_active', 'order', 'created_at']
	list_filter = ['is_active', 'experience', 'created_at']
	search_fields = ['name', 'position']
	ordering = ['order', 'name']
	
	fieldsets = (
		('Основная информация', {
			'fields': ('name', 'position', 'experience')
		}),
		('Медиа', {
			'fields': ('photo',)
		}),
		('Настройки', {
			'fields': ('is_active', 'order')
		}),
	)


@admin.register(Management)
class ManagementAdmin(admin.ModelAdmin):
	"""Админ-панель для модели Management."""
	
	list_display = ['name', 'position', 'phone', 'is_active', 'order', 'created_at']
	list_filter = ['is_active', 'created_at']
	search_fields = ['name', 'position', 'phone']
	ordering = ['order', 'name']
	
	fieldsets = (
		('Основная информация', {
			'fields': ('name', 'position', 'notes')
		}),
		('Контакты', {
			'fields': ('email', 'phone')
		}),
		('Медиа', {
			'fields': ('photo',)
		}),
		('Настройки', {
			'fields': ('is_active', 'order')
		}),
	)


 