from django.db import models
from django.utils.translation import gettext_lazy as _


class Referee(models.Model):
    """Модель судьи."""
    
    class Category(models.TextChoices):
        CHIEF = 'chief', _('Главный судья')
        ASSISTANT = 'assistant', _('Помощник')
        VAR = 'var', _('VAR')
        INSPECTOR = 'inspector', _('Инспектор')
    
    # 1. ID судьи - автоматически создается Django
    
    # 2. ФИО
    first_name = models.CharField(
        max_length=100,
        verbose_name=_('Имя'),
        help_text=_('Имя судьи')
    )
    
    last_name = models.CharField(
        max_length=100,
        verbose_name=_('Фамилия'),
        help_text=_('Фамилия судьи')
    )
    
    # 3. Категория
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.CHIEF,
        verbose_name=_('Категория'),
        help_text=_('Главный судья / Помощник / VAR / Инспектор')
    )
    
    # 4. Регион/город
    region = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_('Регион / город'),
        help_text=_('Место проживания или работы судьи')
    )
    
    # 5. Опыт (в месяцах)
    experience_months = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Опыт (месяцы)'),
        help_text=_('Опыт работы судьей в месяцах')
    )
    
    # 6. Фото
    photo = models.ImageField(
        upload_to='referees/photos/',
        blank=True,
        null=True,
        verbose_name=_('Фото'),
        help_text=_('Фотография судьи (необязательно)')
    )
    
    # 7. Телефон
    phone = models.CharField(
        max_length=32,
        blank=True,
        verbose_name=_('Телефон'),
        help_text=_('Контактный телефон')
    )
    
    # Дополнительные поля для совместимости
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
        if not self.date_of_birth:
            return None
        today = date.today()
        return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)) 