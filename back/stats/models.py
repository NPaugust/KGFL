from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import Season
from clubs.models import Club


class SeasonStats(models.Model):
    """Модель статистики сезона."""
    
    season = models.OneToOneField(
        Season,
        on_delete=models.CASCADE,
        related_name='stats',
        verbose_name=_('Сезон')
    )
    
    total_matches = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Всего матчей')
    )
    
    total_goals = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Всего голов')
    )
    
    total_attendance = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Общая посещаемость')
    )
    
    average_goals_per_match = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0,
        verbose_name=_('Среднее количество голов за матч')
    )
    
    average_attendance_per_match = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Средняя посещаемость за матч')
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
        verbose_name = _('Статистика сезона')
        verbose_name_plural = _('Статистика сезонов')
    
    def __str__(self):
        return f"Статистика {self.season.name}"
    
    def save(self, *args, **kwargs):
        if self.total_matches > 0:
            self.average_goals_per_match = self.total_goals / self.total_matches
            self.average_attendance_per_match = self.total_attendance // self.total_matches
        super().save(*args, **kwargs)


class ClubStats(models.Model):
    """Модель статистики клуба."""
    
    club = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='statistics',
        verbose_name=_('Клуб')
    )
    
    season = models.ForeignKey(
        Season,
        on_delete=models.CASCADE,
        related_name='club_statistics',
        verbose_name=_('Сезон')
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
    
    points = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Очки')
    )
    
    position = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Позиция')
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
        verbose_name = _('Статистика клуба')
        verbose_name_plural = _('Статистика клубов')
        unique_together = ['club', 'season']
        ordering = ['season', 'position', '-points']
    
    def __str__(self):
        return f"{self.club.name} - {self.season.name}"
    
    @property
    def goal_difference(self):
        return self.goals_for - self.goals_against
    
    @property
    def win_percentage(self):
        if self.matches_played > 0:
            return (self.wins / self.matches_played) * 100
        return 0
    
    def save(self, *args, **kwargs):
        # Автоматический расчет очков
        self.points = (self.wins * 3) + self.draws
        super().save(*args, **kwargs) 