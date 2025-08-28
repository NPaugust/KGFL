from django.contrib import admin
from .models import Player, PlayerStats


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    """Админ-панель для модели Player."""
    
    list_display = ['first_name', 'last_name', 'club', 'position', 'number', 'age', 'is_active']
    list_filter = ['position', 'club', 'season', 'is_active', 'nationality']
    search_fields = ['first_name', 'last_name', 'club__name']
    ordering = ['last_name', 'first_name']
    
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
        ('Биография', {
            'fields': ('bio',)
        }),
        ('Медиа', {
            'fields': ('photo',)
        }),
        ('Статус', {
            'fields': ('is_active',)
        }),
    )
    
    readonly_fields = ['age']


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