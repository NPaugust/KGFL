from django.contrib import admin
from .models import Referee


@admin.register(Referee)
class RefereeAdmin(admin.ModelAdmin):
    """Админ-панель для модели Referee."""
    
    list_display = ['first_name', 'last_name', 'category', 'nationality', 'experience_years', 'is_active']
    list_filter = ['category', 'nationality', 'is_active']
    search_fields = ['first_name', 'last_name', 'nationality']
    ordering = ['last_name', 'first_name']
    
    fieldsets = (
        ('Личная информация', {
            'fields': ('first_name', 'last_name', 'date_of_birth', 'nationality')
        }),
        ('Категория и опыт', {
            'fields': ('category', 'experience_years', 'matches_officiated')
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