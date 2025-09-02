from django.contrib import admin
from .models import Club, Coach, ClubSeason


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    """Админ-панель для модели Club."""
    
    list_display = ['name', 'short_name', 'city', 'founded', 'is_active', 'created_at']
    list_filter = ['is_active', 'city', 'founded', 'created_at']
    search_fields = ['name', 'short_name', 'city']
    ordering = ['name']
    
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'short_name')
        }),
        ('Местоположение', {
            'fields': ('city', 'stadium', 'stadium_capacity')
        }),
        ('Информация', {
            'fields': ('founded', 'colors', 'website')
        }),
        ('Медиа', {
            'fields': ('logo',)
        }),
        ('Статус', {
            'fields': ('is_active',)
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
    
    list_display = ['club', 'season', 'position', 'points', 'matches_played', 'goal_difference']
    list_filter = ['season', 'club', 'created_at']
    search_fields = ['club__name', 'season__name']
    ordering = ['season', 'position']
    
    fieldsets = (
        ('Клуб и сезон', {
            'fields': ('club', 'season')
        }),
        ('Статистика матчей', {
            'fields': ('matches_played', 'wins', 'draws', 'losses')
        }),
        ('Голы', {
            'fields': ('goals_for', 'goals_against')
        }),
        ('Позиция', {
            'fields': ('position', 'points')
        }),
    )
    
    readonly_fields = ['goal_difference'] 