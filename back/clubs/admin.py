from django.contrib import admin
from .models import Club, Coach, ClubSeason


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
	"""Админ-панель для модели Club."""
	
	list_display = ['name', 'city', 'founded', 'coach_full_name', 'assistant_full_name', 'contact_phone', 'participation_fee', 'status', 'created_at']
	list_filter = ['status', 'city', 'participation_fee', 'founded', 'created_at']
	search_fields = ['name', 'city', 'coach_full_name', 'assistant_full_name', 'captain_full_name']
	ordering = ['name']
	
	fieldsets = (
		('Основная информация', {
			'fields': ('name', 'logo', 'description')
		}),
		('Местоположение и основание', {
			'fields': ('city', 'founded')
		}),
		('Цвета формы', {
			'fields': ('primary_kit_color', 'secondary_kit_color')
		}),
		('Состав и штаб', {
			'fields': ('coach_full_name', 'assistant_full_name', 'captain_full_name')
		}),
		('Контакты и соцсети', {
			'fields': ('contact_phone', 'contact_email', 'social_media', 'website')
		}),
		('Участие и статус', {
			'fields': ('participation_fee', 'status', 'is_active')
		}),
	)


@admin.register(Coach)
class CoachAdmin(admin.ModelAdmin):
	"""Админ-панель для модели Coach."""
	
	list_display = ['first_name', 'last_name', 'club', 'season', 'nationality', 'is_active']
	list_filter = ['is_active', 'nationality', 'season', 'club', 'created_at']
	search_fields = ['first_name', 'last_name']
	ordering = ['last_name', 'first_name']
	
	fieldsets = (
		('Личная информация', {
			'fields': ('first_name', 'last_name', 'date_of_birth', 'nationality')
		}),
		('Клуб и сезон', {
			'fields': ('club', 'season')
		}),
		('Медиа', {
			'fields': ('photo',)
		}),
		('Статус', {
			'fields': ('is_active',)
		}),
	)


@admin.register(ClubSeason)
class ClubSeasonAdmin(admin.ModelAdmin):
	"""Админ-панель для модели ClubSeason."""
	
	list_display = ['club', 'season', 'position', 'points', 'games', 'wins', 'draws', 'losses', 'goals_for', 'goals_against', 'goal_difference']
	list_filter = ['season', 'club', 'created_at']
	search_fields = ['club__name', 'season__name']
	ordering = ['season', 'position']
	
	fieldsets = (
		('Клуб и сезон', {
			'fields': ('club', 'season')
		}),
		('Статистика матчей', {
			'fields': ('games', 'wins', 'draws', 'losses')
		}),
		('Голы', {
			'fields': ('goals_for', 'goals_against', 'goal_difference')
		}),
		('Позиция', {
			'fields': ('position', 'points')
		}),
	)
	
	readonly_fields = ['goal_difference'] 