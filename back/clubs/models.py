from django.db import models
from django.utils.translation import gettext_lazy as _
from core.models import Season
from django.core.exceptions import ValidationError


def validate_logo_content_type(file_obj):
    valid_types = {"image/png", "image/svg+xml", "image/webp", "image/jpeg", "image/jpg"}
    content_type = getattr(file_obj, "content_type", None)
    if content_type and content_type not in valid_types:
        raise ValidationError(_("Разрешены только PNG, SVG, WEBP или JPEG логотипы."))


class Club(models.Model):
    """Модель футбольного клуба (команды)."""
    
    # 1. ID команды - автоматически создается Django
    # 2. Название команды
    name = models.CharField(
        max_length=200,
        verbose_name=_('Название команды'),
        help_text=_('Отображается в списках и на сайте')
    )
    
    # 3. Логотип
    logo = models.FileField(
        upload_to='clubs/logos/',
        verbose_name=_('Логотип'),
        help_text=_('SVG/PNG/WEBP/JPEG'),
        null=True,
        blank=True,
        default='default-club-logo.png',
        validators=[validate_logo_content_type]
    )
    
    # 4. Город / регион
    city = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_('Город / регион'),
        help_text=_('Например: Бишкек')
    )
    
    # 5. Год основания
    founded = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Год основания'),
        help_text=_('Опционально')
    )
    
    # 6. Цвета формы (основная)
    primary_kit_color = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_('Цвета формы (основная)'),
        help_text=_('Можно указать HEX или словом')
    )
    
    # 7. Цвета формы (запасная)
    secondary_kit_color = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_('Цвета формы (запасная)')
    )
    
    # 8. Тренер (ФИО)
    coach_full_name = models.CharField(
        max_length=150,
        verbose_name=_('Тренер (ФИО)'),
        help_text=_('Главный тренер')
    )
    
    # 9. Ассистент тренера / менеджер
    assistant_full_name = models.CharField(
        max_length=150,
        verbose_name=_('Ассистент тренера / менеджер')
    )
    
    # 10. Капитан команды (ФИО)
    captain_full_name = models.CharField(
        max_length=150,
        blank=True,
        verbose_name=_('Капитан команды (ФИО)'),
        help_text=_('Опционально')
    )
    
    # 11. Телефон контактного лица
    contact_phone = models.CharField(
        max_length=32,
        verbose_name=_('Телефон контактного лица'),
        help_text=_('Для связи с организаторами')
    )
    
    # 12. Email контактного лица
    contact_email = models.EmailField(
        blank=True,
        verbose_name=_('Email контактного лица'),
        help_text=_('Опционально')
    )
    
    # 13. Соцсети
    social_media = models.URLField(
        blank=True,
        verbose_name=_('Соцсети'),
        help_text=_('Instagram, Facebook и т.д.')
    )
    
    # 14. Описание / краткая информация
    description = models.TextField(
        blank=True,
        verbose_name=_('Описание / краткая информация'),
        help_text=_('Опционально')
    )
    
    # 15. Взнос на участие
    class ParticipationFee(models.TextChoices):
        YES = 'yes', _('Есть')
        NO = 'no', _('Нет')
        PARTIAL = 'partial', _('Частично')
    
    participation_fee = models.CharField(
        max_length=20,
        choices=ParticipationFee.choices,
        default=ParticipationFee.NO,
        verbose_name=_('Взнос на участие')
    )
    
    # 16. Статус команды
    class TeamStatus(models.TextChoices):
        APPLIED = 'applied', _('Подана заявка')
        ACTIVE = 'active', _('Активна')
        DISQUALIFIED = 'disqualified', _('Дисквалифицирована')
        WITHDRAWN = 'withdrawn', _('Выбыла')
    
    status = models.CharField(
        max_length=32,
        choices=TeamStatus.choices,
        default=TeamStatus.APPLIED,
        verbose_name=_('Статус команды')
    )
    
    # Дополнительные поля для совместимости
    short_name = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_('Краткое название')
    )
    
    website = models.URLField(
        blank=True,
        verbose_name=_('Веб-сайт')
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
        blank=True,
        verbose_name=_('Имя')
    )
    
    last_name = models.CharField(
        max_length=100,
        blank=True,
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
    
    # Новое поле по ТЗ: количество игр (для совместимости с фронтом и сигналами)
    games = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Игры')
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
    
    # Новое поле по ТЗ: разница мячей (материализованное поле)
    goal_difference = models.IntegerField(
        default=0,
        verbose_name=_('Разница мячей')
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
    def goals_formatted(self):
        return f"{self.goals_for}:{self.goals_against}"
    
    def update_stats_from_match(self, match):
        """Обновить статистику клуба на основе матча."""
        if match.status != 'finished':
            return
            
        # Определяем, является ли клуб домашней или гостевой командой
        is_home = self.club_id == getattr(match.home_team, 'id', None)
        
        if is_home:
            goals_for = match.home_score or 0
            goals_against = match.away_score or 0
        else:
            goals_for = match.away_score or 0
            goals_against = match.home_score or 0
        
        # Обновляем статистику
        self.goals_for += goals_for
        self.goals_against += goals_against
        # Инкрементируем и новое поле, и старое для совместимости
        self.games += 1  # Новое поле по ТЗ
        self.matches_played += 1  # Старое поле, чтобы не сломать место использования
        
        # Определяем результат матча
        if goals_for > goals_against:
            self.wins += 1
            self.points += 3
        elif goals_for == goals_against:
            self.draws += 1
            self.points += 1
        else:
            self.losses += 1
        
        # Рассчитываем разность голов
        self.goal_difference = self.goals_for - self.goals_against
        
        self.save() 