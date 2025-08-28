from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import Season


class Club(models.Model):
    """Модель футбольного клуба."""
    
    name = models.CharField(
        max_length=200,
        verbose_name=_('Название')
    )
    
    short_name = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_('Краткое название')
    )
    
    logo = models.ImageField(
        upload_to='clubs/logos/',
        blank=True,
        null=True,
        verbose_name=_('Логотип')
    )
    
    city = models.CharField(
        max_length=100,
        verbose_name=_('Город')
    )
    
    founded = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Год основания')
    )
    
    stadium = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_('Стадион')
    )
    
    stadium_capacity = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Вместимость стадиона')
    )
    
    website = models.URLField(
        blank=True,
        verbose_name=_('Веб-сайт')
    )
    
    description = models.TextField(
        blank=True,
        verbose_name=_('Описание')
    )
    
    colors = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_('Цвета клуба')
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name=_('Активен')
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
        verbose_name = _('Клуб')
        verbose_name_plural = _('Клубы')
        ordering = ['name']
    
    def __str__(self):
        return self.name


class Coach(models.Model):
    """Модель тренера."""
    
    first_name = models.CharField(
        max_length=100,
        verbose_name=_('Имя')
    )
    
    last_name = models.CharField(
        max_length=100,
        verbose_name=_('Фамилия')
    )
    
    photo = models.ImageField(
        upload_to='coaches/photos/',
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
    
    bio = models.TextField(
        blank=True,
        verbose_name=_('Биография')
    )
    
    club = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='coaches',
        verbose_name=_('Клуб')
    )
    
    season = models.ForeignKey(
        Season,
        on_delete=models.CASCADE,
        related_name='coaches',
        verbose_name=_('Сезон')
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name=_('Активен')
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
        verbose_name = _('Тренер')
        verbose_name_plural = _('Тренеры')
        ordering = ['last_name', 'first_name']
        unique_together = ['club', 'season']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.club.name})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class ClubSeason(models.Model):
    """Модель для связи клуба с сезоном."""
    
    club = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='seasons',
        verbose_name=_('Клуб')
    )
    
    season = models.ForeignKey(
        Season,
        on_delete=models.CASCADE,
        related_name='clubs',
        verbose_name=_('Сезон')
    )
    
    points = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Очки')
    )
    
    matches_played = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Сыгранные матчи')
    )
    
    wins = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Победы')
    )
    
    draws = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Ничьи')
    )
    
    losses = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Поражения')
    )
    
    goals_for = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Забитые голы')
    )
    
    goals_against = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Пропущенные голы')
    )
    
    position = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Позиция в таблице')
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
        verbose_name = _('Клуб в сезоне')
        verbose_name_plural = _('Клубы в сезонах')
        unique_together = ['club', 'season']
        ordering = ['season', 'position', 'points']
    
    def __str__(self):
        return f"{self.club.name} - {self.season.name}"
    
    @property
    def goal_difference(self):
        return self.goals_for - self.goals_against
    
    @property
    def goals_formatted(self):
        return f"{self.goals_for}:{self.goals_against}"
    
    def update_stats_from_match(self, match):
        """Обновить статистику клуба на основе матча."""
        if match.status != 'finished':
            return
            
        # Определяем, является ли клуб домашней или гостевой командой
        is_home = self == match.home_team
        
        if is_home:
            goals_for = match.home_score or 0
            goals_against = match.away_score or 0
        else:
            goals_for = match.away_score or 0
            goals_against = match.home_score or 0
        
        # Обновляем статистику
        self.goals_for += goals_for
        self.goals_against += goals_against
        self.matches_played += 1
        
        # Определяем результат матча
        if goals_for > goals_against:
            self.wins += 1
            self.points += 3
        elif goals_for == goals_against:
            self.draws += 1
            self.points += 1
        else:
            self.losses += 1
        
        self.save() 