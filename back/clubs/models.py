from django.db import models
from django.utils.translation import gettext_lazy as _
from django.utils import timezone
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
        help_text=_('SVG/PNG/WEBP/JPEG (необязательно)'),
        null=True,
        blank=True,
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
        blank=True,
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
    
    @property 
    def last_5(self):
        """Результаты последних 5 матчей клуба."""
        from matches.models import Match
        
        # Получаем последние 5 завершенных/живых матчей клуба в этом сезоне
        matches = Match.objects.filter(
            season=self.season,
            status__in=['finished', 'live']
        ).filter(
            models.Q(home_team=self.club) | models.Q(away_team=self.club)
        ).order_by('-date', '-time')[:5]
        
        results = []
        for match in matches:
            # Проверяем что счет матча заполнен
            if match.home_score is None or match.away_score is None:
                continue
                
            if match.home_team == self.club:
                # Клуб играл дома
                if match.home_score > match.away_score:
                    results.append('W')  # Победа
                elif match.home_score == match.away_score:
                    results.append('D')  # Ничья
                else:
                    results.append('L')  # Поражение
            else:
                # Клуб играл в гостях  
                if match.away_score > match.home_score:
                    results.append('W')  # Победа
                elif match.away_score == match.home_score:
                    results.append('D')  # Ничья
                else:
                    results.append('L')  # Поражение
        
        # Возвращаем массив из 5 элементов (заполняем пустыми если матчей меньше)
        while len(results) < 5:
            results.append(None)
            
        return results
    
    # Метод update_stats_from_match удален - теперь статистика обновляется только через сигналы


class ClubApplication(models.Model):
    """Модель заявки клуба на участие в лиге."""
    
    class ApplicationStatus(models.TextChoices):
        PENDING = 'pending', _('Ожидает рассмотрения')
        APPROVED = 'approved', _('Одобрена')
        REJECTED = 'rejected', _('Отклонена')
        WITHDRAWN = 'withdrawn', _('Отозвана')
    
    # Основная информация о клубе
    club_name = models.CharField(
        max_length=200,
        verbose_name=_('Название клуба'),
        help_text=_('Официальное название клуба')
    )
    
    short_name = models.CharField(
        max_length=50,
        blank=True,
        verbose_name=_('Краткое название')
    )
    
    city = models.CharField(
        max_length=100,
        verbose_name=_('Город/регион')
    )
    
    founded = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Год основания')
    )
    
    # Контактная информация
    contact_person = models.CharField(
        max_length=200,
        verbose_name=_('Контактное лицо')
    )
    
    contact_phone = models.CharField(
        max_length=32,
        blank=True,
        verbose_name=_('Контактный телефон')
    )
    
    contact_email = models.EmailField(
        blank=True,
        verbose_name=_('Контактный email')
    )
    
    # Тренерский штаб
    coach_name = models.CharField(
        max_length=200,
        verbose_name=_('Главный тренер')
    )
    
    assistant_coach = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_('Ассистент тренера')
    )
    
    # Документы и файлы
    logo = models.FileField(
        upload_to='applications/logos/',
        blank=True,
        null=True,
        verbose_name=_('Логотип клуба')
    )
    
    documents = models.FileField(
        upload_to='applications/documents/',
        blank=True,
        null=True,
        verbose_name=_('Документы клуба (необязательно)')
    )
    
    # Статус заявки
    status = models.CharField(
        max_length=20,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.PENDING,
        verbose_name=_('Статус заявки')
    )
    
    # Дополнительная информация
    description = models.TextField(
        blank=True,
        verbose_name=_('Описание клуба')
    )
    
    notes = models.TextField(
        blank=True,
        verbose_name=_('Примечания администратора')
    )
    
    # Связь с клубом (если заявка одобрена)
    club = models.OneToOneField(
        Club,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name='application',
        verbose_name=_('Созданный клуб')
    )
    
    # Сезон, на который подается заявка
    season = models.ForeignKey(
        Season,
        on_delete=models.CASCADE,
        related_name='applications',
        verbose_name=_('Сезон')
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name=_('Дата подачи заявки')
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name=_('Дата обновления')
    )
    
    reviewed_at = models.DateTimeField(
        blank=True,
        null=True,
        verbose_name=_('Дата рассмотрения')
    )
    
    reviewed_by = models.ForeignKey(
        'core.User',
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        verbose_name=_('Рассмотрел')
    )
    
    class Meta:
        verbose_name = _('Заявка клуба')
        verbose_name_plural = _('Заявки клубов')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.club_name} - {self.season.name} ({self.get_status_display()})"
    
    def approve(self, user):
        """Одобрить заявку и создать клуб."""
        if self.status != self.ApplicationStatus.PENDING:
            raise ValueError("Можно одобрить только заявки со статусом 'Ожидает рассмотрения'")
        
        # Создаем клуб
        club = Club.objects.create(
            name=self.club_name,
            short_name=self.short_name,
            city=self.city,
            founded=self.founded,
            coach_full_name=self.coach_name,
            assistant_full_name=self.assistant_coach,
            contact_phone=self.contact_phone,
            contact_email=self.contact_email,
            description=self.description,
            status='active'
        )
        
        # Обновляем заявку
        self.status = self.ApplicationStatus.APPROVED
        self.club = club
        self.reviewed_at = timezone.now()
        self.reviewed_by = user
        self.save()
        
        return club
    
    def reject(self, user, reason=None):
        """Отклонить заявку."""
        if self.status != self.ApplicationStatus.PENDING:
            raise ValueError("Можно отклонить только заявки со статусом 'Ожидает рассмотрения'")
        
        self.status = self.ApplicationStatus.REJECTED
        self.reviewed_at = timezone.now()
        self.reviewed_by = user
        if reason:
            self.notes = reason
        self.save() 