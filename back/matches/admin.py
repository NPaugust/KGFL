from django.contrib import admin
from .models import Match, Goal, Card, Substitution


@admin.register(Match)
class MatchAdmin(admin.ModelAdmin):
	"""Админ-панель для модели Match."""
	
	list_display = ['date', 'time', 'home_team', 'away_team', 'score_display', 'status', 'season', 'group', 'stadium', 'stadium_ref']
	list_filter = ['status', 'date', 'season', 'group', 'home_team', 'away_team', 'stadium_ref']
	search_fields = ['home_team__name', 'away_team__name', 'stadium']
	ordering = ['-date', '-time']
	
	def get_form(self, request, obj=None, **kwargs):
		"""Динамически показываем/скрываем поле group в зависимости от сезона."""
		form = super().get_form(request, obj, **kwargs)
		
		# Если объект существует и сезон не имеет групп - делаем поле group необязательным
		if obj and obj.season and obj.season.format != 'groups':
			form.base_fields['group'].required = False
			form.base_fields['group'].help_text = 'Этот сезон не имеет группового этапа. Поле можно оставить пустым.'
		
		return form
	
	fieldsets = (
		('Команды и сезон', {
			'fields': ('home_team', 'away_team', 'season', 'group'),
			'description': 'Если сезон имеет групповой этап - выберите группу для матча.'
		}),
		('Время и место', {
			'fields': ('date', 'time', 'stadium_ref', 'stadium', 'round', 'attendance')
		}),
		('Результат', {
			'fields': ('status', 'home_score', 'away_score', 'home_score_ht', 'away_score_ht')
		}),
	)
	
	def score_display(self, obj):
		return obj.score_display
	score_display.short_description = 'Счет'


@admin.register(Goal)
class GoalAdmin(admin.ModelAdmin):
	"""Админ-панель для модели Goal."""
	
	list_display = ['scorer', 'team', 'match', 'minute', 'goal_type']
	list_filter = ['goal_type', 'team', 'match__date']
	search_fields = ['scorer__first_name', 'scorer__last_name', 'team__name']
	ordering = ['match', 'minute']
	
	fieldsets = (
		('Основная информация', {
			'fields': ('match', 'scorer', 'assist', 'team')
		}),
		('Детали гола', {
			'fields': ('minute', 'goal_type', 'description')
		}),
	)


@admin.register(Card)
class CardAdmin(admin.ModelAdmin):
	"""Админ-панель для модели Card."""
	
	list_display = ['player', 'team', 'match', 'card_type', 'minute']
	list_filter = ['card_type', 'team', 'match__date']
	search_fields = ['player__first_name', 'player__last_name', 'team__name']
	ordering = ['match', 'minute']
	
	fieldsets = (
		('Основная информация', {
			'fields': ('match', 'player', 'team')
		}),
		('Детали карточки', {
			'fields': ('card_type', 'minute', 'reason')
		}),
	)


@admin.register(Substitution)
class SubstitutionAdmin(admin.ModelAdmin):
	"""Админ-панель для модели Substitution."""
	
	list_display = ['player_out', 'player_in', 'team', 'match', 'minute']
	list_filter = ['team', 'match__date']
	search_fields = ['player_out__first_name', 'player_out__last_name', 'player_in__first_name', 'player_in__last_name']
	ordering = ['match', 'minute']
	
	fieldsets = (
		('Основная информация', {
			'fields': ('match', 'team')
		}),
		('Замена', {
			'fields': ('player_out', 'player_in', 'minute')
		}),
	) 