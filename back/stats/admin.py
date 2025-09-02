from django.contrib import admin
from .models import SeasonStats, ClubStats


@admin.register(SeasonStats)
class SeasonStatsAdmin(admin.ModelAdmin):
    """Админ-панель для модели SeasonStats."""
    
    list_display = ['season', 'total_matches', 'total_goals', 'average_goals_per_match', 'total_attendance']
    list_filter = ['season']
    search_fields = ['season__name']
    ordering = ['season']
    
    fieldsets = (
        ('Сезон', {
            'fields': ('season',)
        }),
        ('Матчи', {
            'fields': ('total_matches',)
        }),
        ('Голы', {
            'fields': ('total_goals',)
        }),
        ('Посещаемость', {
            'fields': ('total_attendance',)
        }),
    )
    
    readonly_fields = ['average_goals_per_match', 'average_attendance_per_match']


@admin.register(ClubStats)
class ClubStatsAdmin(admin.ModelAdmin):
    """Админ-панель для модели ClubStats."""
    
    list_display = ['club', 'season', 'position', 'points', 'matches_played', 'goals_for', 'goals_against', 'goal_difference']
    list_filter = ['season', 'club']
    search_fields = ['club__name', 'season__name']
    ordering = ['season', 'position']
    
    fieldsets = (
        ('Клуб и сезон', {
            'fields': ('club', 'season')
        }),
        ('Позиция', {
            'fields': ('position', 'points')
        }),
        ('Матчи', {
            'fields': ('matches_played', 'wins', 'draws', 'losses')
        }),
        ('Голы', {
            'fields': ('goals_for', 'goals_against')
        }),
    )
    
    readonly_fields = ['goal_difference', 'win_percentage'] 