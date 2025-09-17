from django.contrib import admin
from .models import Player, PlayerStats, PlayerTransfer


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
	"""Админ-панель для модели Player."""
	
	list_display = ['first_name', 'last_name', 'club', 'position', 'number', 'nationality', 'phone', 'status', 'age', 'is_active']
	list_filter = ['position', 'club', 'season', 'status', 'is_active', 'nationality']
	search_fields = ['first_name', 'last_name', 'club__name', 'phone']
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
		('Клуб и сезон', {
			'fields': ('club', 'season', 'position', 'number')
		}),
		('Физические данные', {
			'fields': ('height', 'weight')
		}),
		('Контакты', {
			'fields': ('phone',)
		}),
		('Медиа', {
			'fields': ('photo', 'photo_preview')
		}),
		('Примечание и статус', {
			'fields': ('notes', 'status', 'is_active')
		}),
	)
	
	readonly_fields = ['age', 'photo_preview']


@admin.register(PlayerStats)
class PlayerStatsAdmin(admin.ModelAdmin):
	"""Админ-панель для модели PlayerStats."""
	
	list_display = ['player', 'season', 'matches_played', 'goals', 'assists', 'yellow_cards', 'red_cards']
	list_filter = ['season', 'player__club', 'player__position']
	search_fields = ['player__first_name', 'player__last_name', 'player__club__name']
	ordering = ['season', 'player']
	
	fieldsets = (
		('Игрок и сезон', {
			'fields': ('player', 'season')
		}),
		('Матчи', {
			'fields': ('matches_played', 'matches_started', 'minutes_played')
		}),
		('Голы и передачи', {
			'fields': ('goals', 'assists')
		}),
		('Карточки', {
			'fields': ('yellow_cards', 'red_cards')
		}),
		('Вратарь', {
			'fields': ('clean_sheets',)
		}),
	)


@admin.register(PlayerTransfer)
class PlayerTransferAdmin(admin.ModelAdmin):
	"""Админ-панель для модели PlayerTransfer."""
	
	list_display = ['player', 'from_club', 'to_club', 'transfer_date', 'status']
	list_filter = ['status', 'transfer_date', 'from_club', 'to_club']
	search_fields = ['player__first_name', 'player__last_name', 'from_club__name', 'to_club__name']
	ordering = ['-transfer_date']
	
	fieldsets = (
		('Основная информация', {
			'fields': ('player', 'from_club', 'to_club', 'transfer_date', 'status')
		}),
		('Дополнительно', {
			'fields': ('transfer_fee', 'notes')
		}),
	) 