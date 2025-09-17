from django.db import models
from django.utils.translation import gettext_lazy as _
from clubs.models import Club
from core.models import Season


class Stadium(models.Model):
    """Справочник стадионов."""

    name = models.CharField(max_length=200, verbose_name=_('Название'))
    city = models.CharField(max_length=100, blank=True, verbose_name=_('Город/регион'))
    capacity = models.PositiveIntegerField(blank=True, null=True, verbose_name=_('Вместимость'))
    address = models.CharField(max_length=300, blank=True, default='', verbose_name=_('Адрес'))

    class Meta:
        verbose_name = _('Стадион')
        verbose_name_plural = _('Стадионы')
        ordering = ['name']

    def __str__(self):
        return self.name


class Match(models.Model):
    """Модель матча."""
    
    class Status(models.TextChoices):
        SCHEDULED = 'scheduled', _('Назначен')
        LIVE = 'live', _('Идёт игра')
        FINISHED = 'finished', _('Закончен')
        POSTPONED = 'postponed', _('Перенос матча')
    
    # 1. ID матча - автоматически создается Django
    
    # 2. Дата
    date = models.DateField(
        default='2025-01-01',
        verbose_name=_('Дата'),
        help_text=_('ДД-ММ-ГГГГ Дата проведения матча')
    )
    
    # 3. Домашняя команда
    home_team = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='home_matches',
        verbose_name=_('Домашняя команда'),
        help_text=_('Команда, принимающая матч дома'),
        null=False,
        blank=False,
        default=None
    )
    
    # 4. Счет (делится на голы домашней и гостевой команды)
    home_score = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Голы домашней команды'),
        help_text=_('Количество голов домашней команды')
    )
    
    away_score = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Голы гостевой команды'),
        help_text=_('Количество голов гостевой команды')
    )
    
    # 5. Гостевая команда
    away_team = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='away_matches',
        verbose_name=_('Гостевая команда'),
        help_text=_('Команда, играющая в гостях'),
        null=False,
        blank=False,
        default=None
    )
    
    # 6. Стадион
    stadium = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_('Стадион'),
        help_text=_('Название стадиона')
    )
    
    # 7. Статус
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.SCHEDULED,
        verbose_name=_('Статус'),
        help_text=_('Статус матча (запланирован, в эфире, завершен и т.д.)')
    )
    
    # 8. Время
    time = models.TimeField(
        default='15:00',
        verbose_name=_('Время'),
        help_text=_('ЧЧ:ММ Время начала матча')
    )
    
    # Дополнительные поля для совместимости
    season = models.ForeignKey(
        Season,
        on_delete=models.CASCADE,
        related_name='matches',
        blank=True,
        null=True,
        verbose_name=_('Сезон')
    )
    
    home_score_ht = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Голы домашней команды (первый тайм)')
    )
    
    away_score_ht = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Голы гостевой команды (первый тайм)')
    )

    stadium_ref = models.ForeignKey(
        Stadium,
        on_delete=models.PROTECT,
        related_name='matches',
        blank=True,
        null=True,
        verbose_name=_('Стадион (справочник)')
    )
    
    attendance = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Посещаемость')
    )
    
    round = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Тур')
    )
    
    description = models.TextField(
        blank=True,
        verbose_name=_('Описание')
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Дата создания')
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_('Дата обновления')
    )
    
    class Meta:
        verbose_name = _('Матч')
        verbose_name_plural = _('Матчи')
        ordering = ['-date', '-time']
        # Убираем ограничение уникальности для тестирования
        # unique_together = ['home_team', 'away_team', 'season']
    
    def __str__(self):
        home = getattr(self.home_team, 'name', '—') or '—'
        away = getattr(self.away_team, 'name', '—') or '—'
        date_str = str(self.date) if self.date else 'дата не указана'
        return f"{home} vs {away} ({date_str})"
    
    @property
    def score_display(self):
        if self.home_score is not None and self.away_score is not None:
            return f"{self.home_score} - {self.away_score}"
        return "vs"
    
    @property
    def is_finished(self):
        return self.status == self.Status.FINISHED
    
    @property
    def is_live(self):
        return self.status == self.Status.LIVE


class Goal(models.Model):
    """Модель гола."""
    
    class GoalType(models.TextChoices):
        GOAL = 'goal', _('Гол')
        PENALTY = 'penalty', _('Пенальти')
        OWN_GOAL = 'own_goal', _('Автогол')
        FREE_KICK = 'free_kick', _('Свободный удар')
        HEADER = 'header', _('Головой')
    
    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name='goals',
        verbose_name=_('Матч')
    )
    
    scorer = models.ForeignKey(
        'players.Player',
        on_delete=models.CASCADE,
        related_name='goals_scored',
        verbose_name=_('Забивший')
    )
    
    assist = models.ForeignKey(
        'players.Player',
        on_delete=models.CASCADE,
        related_name='assists',
        blank=True,
        null=True,
        verbose_name=_('Передача')
    )
    
    team = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='goals',
        verbose_name=_('Команда')
    )
    
    minute = models.PositiveIntegerField(
        verbose_name=_('Минута')
    )
    
    goal_type = models.CharField(
        max_length=20,
        choices=GoalType.choices,
        default=GoalType.GOAL,
        verbose_name=_('Тип гола')
    )
    
    description = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_('Описание')
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Дата создания')
    )
    
    class Meta:
        verbose_name = _('Гол')
        verbose_name_plural = _('Голы')
        ordering = ['match', 'minute']
    
    def __str__(self):
        return f"{self.scorer.full_name} ({self.minute}') - {self.match}"


class Card(models.Model):
    """Модель карточки."""
    
    class CardType(models.TextChoices):
        YELLOW = 'yellow', _('Желтая')
        RED = 'red', _('Красная')
        SECOND_YELLOW = 'second_yellow', _('Вторая желтая')
    
    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name='cards',
        verbose_name=_('Матч')
    )
    
    player = models.ForeignKey(
        'players.Player',
        on_delete=models.CASCADE,
        related_name='cards',
        verbose_name=_('Игрок')
    )
    
    team = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='cards',
        verbose_name=_('Команда')
    )
    
    card_type = models.CharField(
        max_length=20,
        choices=CardType.choices,
        verbose_name=_('Тип карточки')
    )
    
    minute = models.PositiveIntegerField(
        verbose_name=_('Минута')
    )
    
    reason = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_('Причина')
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Дата создания')
    )
    
    class Meta:
        verbose_name = _('Карточка')
        verbose_name_plural = _('Карточки')
        ordering = ['match', 'minute']
    
    def __str__(self):
        return f"{self.player.full_name} - {self.get_card_type_display()} ({self.minute}')"


class Substitution(models.Model):
    """Модель замены."""
    
    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name='substitutions',
        verbose_name=_('Матч')
    )
    
    player_in = models.ForeignKey(
        'players.Player',
        on_delete=models.CASCADE,
        related_name='substitutions_in',
        verbose_name=_('Игрок входящий')
    )
    
    player_out = models.ForeignKey(
        'players.Player',
        on_delete=models.CASCADE,
        related_name='substitutions_out',
        verbose_name=_('Игрок выходящий')
    )
    
    team = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='substitutions',
        verbose_name=_('Команда')
    )
    
    minute = models.PositiveIntegerField(
        verbose_name=_('Минута')
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Дата создания')
    )
    
    class Meta:
        verbose_name = _('Замена')
        verbose_name_plural = _('Замены')
        ordering = ['match', 'minute']
    
    def __str__(self):
        return f"{self.player_out.full_name} → {self.player_in.full_name} ({self.minute}')"


class Assist(models.Model):
    """Модель передачи (ассиста)."""
    
    match = models.ForeignKey(
        Match,
        on_delete=models.CASCADE,
        related_name='assists',
        verbose_name=_('Матч')
    )
    
    player = models.ForeignKey(
        'players.Player',
        on_delete=models.CASCADE,
        related_name='assist_events',
        verbose_name=_('Игрок')
    )
    
    team = models.ForeignKey(
        'clubs.Club',
        on_delete=models.CASCADE,
        related_name='assist_events',
        verbose_name=_('Команда')
    )
    
    minute = models.PositiveIntegerField(
        verbose_name=_('Минута')
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Дата создания')
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_('Дата обновления')
    )
    
    class Meta:
        verbose_name = _('Передача')
        verbose_name_plural = _('Передачи')
        ordering = ['match', 'minute']
    
    def __str__(self):
        return f"Ассист {self.player.full_name} ({self.match})" 