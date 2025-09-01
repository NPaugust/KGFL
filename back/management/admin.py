from django.contrib import admin
from .models import Manager


@admin.register(Manager)
class ManagerAdmin(admin.ModelAdmin):
    """Админ-панель для модели Manager."""
    
    list_display = ['first_name', 'last_name', 'position', 'order', 'is_active']
    list_filter = ['position', 'is_active']
    search_fields = ['first_name', 'last_name', 'position']
    ordering = ['order', 'last_name', 'first_name']
    
    fieldsets = (
        ('Личная информация', {
            'fields': ('first_name', 'last_name')
        }),
        ('Должность', {
            'fields': ('position', 'order')
        }),
        ('Контакты', {
            'fields': ('email', 'phone')
        }),
        ('Медиа', {
            'fields': ('photo',)
        }),
        ('Статус', {
            'fields': ('is_active',)
        }),
    ) 