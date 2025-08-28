from django.db import models
from django.utils.translation import gettext_lazy as _


class Referee(models.Model):
    """Модель судьи."""
    
    class Category(models.TextChoices):
        INTERNATIONAL = 'international', _('Международный')
        NATIONAL = 'national', _('Национальный')
        REGIONAL = 'regional', _('Региональный')
    
    first_name = models.CharField(
        max_length=100,
        verbose_name=_('Имя')
    )
    
    last_name = models.CharField(
        max_length=100,
        verbose_name=_('Фамилия')
    )
    
    photo = models.ImageField(
        upload_to='referees/photos/',
        blank=True,
        null=True,
        verbose_name=_('Фото')
    )
    
    date_of_birth = models.DateField(
        verbose_name=_('Дата рождения')
    )
    
    nationality = models.CharField(
        max_length=100,
        verbose_name=_('Национальность')
    )
    
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.NATIONAL,
        verbose_name=_('Категория')
    )
    
    experience_years = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Опыт работы (лет)')
    )
    
    matches_officiated = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Отсужденные матчи')
    )
    
    bio = models.TextField(
        blank=True,
        verbose_name=_('Биография')
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
        verbose_name = _('Судья')
        verbose_name_plural = _('Судьи')
        ordering = ['last_name', 'first_name']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.get_category_display()})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def age(self):
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)) 