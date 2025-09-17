from django.db import models
from django.utils.translation import gettext_lazy as _


class Manager(models.Model):
    """Модель руководителя лиги."""
    
    class Position(models.TextChoices):
        PRESIDENT = 'president', _('Президент')
        VICE_PRESIDENT = 'vice_president', _('Вице-президент')
        GENERAL_SECRETARY = 'general_secretary', _('Генеральный секретарь')
        DIRECTOR = 'director', _('Директор')
        MANAGER = 'manager', _('Менеджер')
    
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
    
    position = models.CharField(
        max_length=20,
        choices=Position.choices,
        blank=True,
        verbose_name=_('Должность')
    )
    
    photo = models.ImageField(
        upload_to='management/photos/',
        blank=True,
        null=True,
        verbose_name=_('Фото')
    )
    
    email = models.EmailField(
        blank=True,
        verbose_name=_('Email')
    )
    
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name=_('Телефон')
    )
    
    order = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Порядок')
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
    
    notes = models.TextField(
        blank=True,
        verbose_name=_('Примечание'),
        help_text=_('Дополнительная информация (например, курирует дисциплинарный комитет)')
    )

    class Meta:
        verbose_name = _('Руководитель')
        verbose_name_plural = _('Руководство')
        ordering = ['order', 'last_name', 'first_name']
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.get_position_display()})"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}" 