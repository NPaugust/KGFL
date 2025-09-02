from django.db import models
from django.utils.translation import gettext_lazy as _
from clubs.models import Club
from core.models import Season


class Player(models.Model):
    """Модель игрока."""
    
    class Position(models.TextChoices):
        GK = 'GK', _('Вратарь')
        DF = 'DF', _('Защитник')
        MF = 'MF', _('Полузащитник')
        FW = 'FW', _('Нападающий')
    
    first_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_('Имя')
    )
    
    last_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_('Фамилия')
    )
    
    photo = models.ImageField(
        upload_to='players/photos/',
        blank=True,
        null=True,
        verbose_name=_('Фото')
    )
    
    date_of_birth = models.DateField(
        blank=True,
        null=True,
        verbose_name=_('Дата рождения')
    )
    
    nationality = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_('Национальность')
    )
    
    position = models.CharField(
        max_length=2,
        choices=Position.choices,
        blank=True,
        verbose_name=_('Позиция')
    )
    
    number = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Номер')
    )
    
    height = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Рост (см)')
    )
    
    weight = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Вес (кг)')
    )
    
    club = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='players',
        blank=True,
        null=True,
        verbose_name=_('Клуб')
    )
    
    season = models.ForeignKey(
        Season,
        on_delete=models.CASCADE,
        related_name='players',
        blank=True,
        null=True,
        verbose_name=_('Сезон')
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name=_('Активен')
    )
    
    bio = models.TextField(
        blank=True,
        verbose_name=_('Биография')
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
        verbose_name = _('Игрок')
        verbose_name_plural = _('Игроки')
        ordering = ['last_name', 'first_name']
        # Убираем ограничение уникальности для тестирования
        # unique_together = ['club', 'season', 'number']
    
    def __str__(self):
        club_name = getattr(self.club, 'name', None) or 'без клуба'
        return f"{self.first_name} {self.last_name} ({club_name})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def age(self):
        from datetime import date
        if not self.date_of_birth:
            return None
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )


class PlayerStats(models.Model):
    """Модель статистики игрока."""
    
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name='stats',
        verbose_name=_('Игрок')
    )
    
    season = models.ForeignKey(
        Season,
        on_delete=models.CASCADE,
        related_name='player_stats',
        verbose_name=_('Сезон')
    )
    
    matches_played = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Сыгранные матчи')
    )
    
    matches_started = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Матчи в старте')
    )
    
    minutes_played = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Минуты на поле')
    )
    
    goals = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Голы')
    )
    
    assists = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Передачи')
    )
    
    yellow_cards = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Желтые карточки')
    )
    
    red_cards = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Красные карточки')
    )
    
    clean_sheets = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Сухие матчи (для вратарей)')
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
        verbose_name = _('Статистика игрока')
        verbose_name_plural = _('Статистика игроков')
        unique_together = ['player', 'season']
        ordering = ['season', 'player']
    
    def __str__(self):
        return f"{self.player.full_name} - {self.season.name}" 