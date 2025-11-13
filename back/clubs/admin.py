from django.contrib import admin
from .models import Club, Coach, ClubSeason, ClubApplication


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
	"""Админ-панель для модели Club."""
	
	list_display = ['name', 'city', 'founded', 'coach_full_name', 'assistant_full_name', 'contact_phone', 'participation_fee', 'status', 'created_at']
	list_filter = ['status', 'city', 'participation_fee', 'founded', 'created_at']
	search_fields = ['name', 'city', 'coach_full_name', 'assistant_full_name', 'captain_full_name']
	ordering = ['name']
	
	def logo_preview(self, obj):
		if obj.logo:
			return f'<img src="{obj.logo.url}" style="width: 120px; height: 120px; object-fit: contain; border-radius: 8px;" />'
		return "Нет логотипа"
	logo_preview.allow_tags = True
	logo_preview.short_description = "Логотип"
	
	fieldsets = (
		('Основная информация', {
			'fields': ('name', 'logo', 'logo_preview', 'description')
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
			'fields': ('club', 'season')
		}),
		('Медиа', {
			'fields': ('photo', 'photo_preview')
		}),
		('Статус', {
			'fields': ('is_active',)
		}),
	)


@admin.register(ClubSeason)
class ClubSeasonAdmin(admin.ModelAdmin):
	"""Админ-панель для модели ClubSeason."""
	
	list_display = ['club', 'season', 'group', 'position', 'points', 'games', 'wins', 'draws', 'losses', 'goals_for', 'goals_against', 'goal_difference']
	list_filter = ['season', 'group', 'club', 'created_at']
	search_fields = ['club__name', 'season__name', 'group__name']
	ordering = ['season', 'group', 'position']
	
	def get_form(self, request, obj=None, **kwargs):
		"""Динамически показываем/скрываем поле group в зависимости от сезона."""
		form = super().get_form(request, obj, **kwargs)
		
		# Если объект существует и сезон не имеет групп - делаем поле group необязательным
		if obj and obj.season and obj.season.format != 'groups':
			form.base_fields['group'].required = False
			form.base_fields['group'].help_text = 'Этот сезон не имеет группового этапа. Поле можно оставить пустым.'
		
		return form
	
	fieldsets = (
		('Клуб и сезон', {
			'fields': ('club', 'season', 'group'),
			'description': 'Если сезон имеет групповой этап - выберите группу для клуба.'
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


@admin.register(ClubApplication)
class ClubApplicationAdmin(admin.ModelAdmin):
	"""Админ-панель для модели ClubApplication."""
	
	list_display = ['club_name', 'city', 'contact_person', 'season', 'status', 'created_at', 'reviewed_at']
	list_filter = ['status', 'season', 'created_at', 'reviewed_at']
	search_fields = ['club_name', 'city', 'contact_person', 'coach_name']
	ordering = ['-created_at']
	
	fieldsets = (
		('Основная информация о клубе', {
			'fields': ('club_name', 'short_name', 'city', 'founded', 'description')
		}),
		('Контактная информация', {
			'fields': ('contact_person', 'contact_phone', 'contact_email')
		}),
		('Тренерский штаб', {
			'fields': ('coach_name', 'assistant_coach')
		}),
		('Документы', {
			'fields': ('logo', 'documents')
		}),
		('Сезон и статус', {
			'fields': ('season', 'status')
		}),
		('Рассмотрение', {
			'fields': ('reviewed_by', 'reviewed_at', 'notes')
		}),
		('Созданный клуб', {
			'fields': ('club',)
		}),
	)
	
	readonly_fields = ['created_at', 'updated_at', 'reviewed_at'] 