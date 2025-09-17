from django.db import models
from django.utils.translation import gettext_lazy as _
from clubs.models import Club
from core.models import Season



class Player(models.Model):
    """Модель игрока."""
    
    # 1. ID игрока - автоматически создается Django
    # 2. ID Команды (привязка к команде)
    club = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='players',
        verbose_name=_('Команда'),
        help_text=_('Привязка к команде'),
        null=True,
        blank=True
    )
    
    # 3. ФИО
    first_name = models.CharField(
        max_length=100,
        verbose_name=_('Имя')
    )
    
    last_name = models.CharField(
        max_length=100,
        verbose_name=_('Фамилия')
    )
    
    # 4. Дата рождения
    date_of_birth = models.DateField(
        verbose_name=_('Дата рождения'),
        help_text=_('ДД-ММ-ГГГГ')
    )
    
    # 5. Амплуа (позиция)
    class Position(models.TextChoices):
        GK = 'GK', _('Вратарь')
        DF = 'DF', _('Защитник')
        MF = 'MF', _('Полузащитник')
        FW = 'FW', _('Нападающий')
    
    position = models.CharField(
        max_length=2,
        choices=Position.choices,
        verbose_name=_('Амплуа (позиция)'),
        help_text=_('Вратарь / Защитник / Полузащитник / Нападающий')
    )
    
    # 6. Игровой номер
    from django.core.validators import MinValueValidator, MaxValueValidator
    number = models.PositiveIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(99)],
        verbose_name=_('Игровой номер'),
        help_text=_('От 1 до 99')
    )
    
    # 7. Рост (см)
    height = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Рост (см)'),
        help_text=_('Опционально')
    )
    
    # 8. Вес (кг)
    weight = models.PositiveIntegerField(
        blank=True,
        null=True,
        verbose_name=_('Вес (кг)'),
        help_text=_('Опционально')
    )
    
    # 9. Гражданство
    nationality = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_('Гражданство'),
        help_text=_('Опционально')
    )
    
    # 10. Фото игрока
    photo = models.ImageField(
        upload_to='players/photos/',
        blank=True,
        null=True,
        verbose_name=_('Фото игрока'),
        help_text=_('Необязательно')
    )
    
    # 11. Телефон
    phone = models.CharField(
        max_length=32,
        blank=True,
        null=True,
        verbose_name=_('Телефон'),
        help_text=_('Для связи при необходимости')
    )
    
    # 12. Примечание
    notes = models.TextField(
        blank=True,
        null=True,
        verbose_name=_('Примечание'),
        help_text=_('Особые условия, травмы, аренда')
    )
    
    # 13. Статус игрока
    class PlayerStatus(models.TextChoices):
        APPLIED = 'applied', _('Заявлен')
        ACTIVE = 'active', _('Активен')
        INJURED = 'injured', _('Травма')
        DISQUALIFIED = 'disqualified', _('Дисквалификация')
        LOAN = 'loan', _('Аренда')
        WITHDRAWN = 'withdrawn', _('Выбыл')
    
    status = models.CharField(
        max_length=32,
        choices=PlayerStatus.choices,
        default=PlayerStatus.APPLIED,
        verbose_name=_('Статус игрока')
    )
    
    # Дополнительные поля для совместимости
    season = models.ForeignKey(
        Season,
        on_delete=models.CASCADE,
        related_name='players',
        blank=True,
        null=True,
        verbose_name=_('Сезон')
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
        verbose_name = _('Игрок')
        verbose_name_plural = _('Игроки')
        ordering = ['last_name', 'first_name']
        constraints = [
            models.UniqueConstraint(
                fields=['club', 'season', 'number'], 
                name='unique_club_season_number', 
                violation_error_message=_('Игровой номер должен быть уникален в рамках клуба и сезона.')
            )
        ]
    
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
    
    @property
    def goals_scored(self):
        """Количество голов игрока в текущем сезоне."""
        from core.models import Season
        try:
            current_season = Season.objects.get(is_active=True)
            stats = self.stats.filter(season=current_season).first()
            return stats.goals if stats else 0
        except Season.DoesNotExist:
            return 0
    
    @property
    def assists(self):
        """Количество ассистов игрока в текущем сезоне."""
        from core.models import Season
        try:
            current_season = Season.objects.get(is_active=True)
            stats = self.stats.filter(season=current_season).first()
            return stats.assists if stats else 0
        except Season.DoesNotExist:
            return 0
    
    @property
    def yellow_cards(self):
        """Количество желтых карточек игрока в текущем сезоне."""
        from core.models import Season
        try:
            current_season = Season.objects.get(is_active=True)
            stats = self.stats.filter(season=current_season).first()
            return stats.yellow_cards if stats else 0
        except Season.DoesNotExist:
            return 0
    
    @property
    def red_cards(self):
        """Количество красных карточек игрока в текущем сезоне."""
        from core.models import Season
        try:
            current_season = Season.objects.get(is_active=True)
            stats = self.stats.filter(season=current_season).first()
            return stats.red_cards if stats else 0
        except Season.DoesNotExist:
            return 0
    
    @property
    def matches_played(self):
        """Количество сыгранных матчей игрока в текущем сезоне."""
        from core.models import Season
        try:
            current_season = Season.objects.get(is_active=True)
            stats = self.stats.filter(season=current_season).first()
            return stats.matches_played if stats else 0
        except Season.DoesNotExist:
            return 0


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


class PlayerTransfer(models.Model):
    """Модель трансфера игрока.
    
    Соответствует требованиям из спецификации: хранит из какой команды,
    в какую, дату перехода и статус. При подтверждении можно обновлять
    поле `club` у игрока.
    """

    class TransferStatus(models.TextChoices):
        CONFIRMED = 'confirmed', _('Подтвержден')
        PENDING = 'pending', _('Ожидание')
        CANCELLED = 'cancelled', _('Отменен')

    # 1. ID трансфера - автоматически создается Django
    # 2. ID игрока
    player = models.ForeignKey(
        Player,
        on_delete=models.CASCADE,
        related_name='transfers',
        verbose_name=_('Игрок'),
        help_text=_('К какому игроку относится трансфер')
    )
    
    # 3. Из команды (nullable)
    from_club = models.ForeignKey(
        Club,
        on_delete=models.SET_NULL,
        related_name='outgoing_transfers',
        blank=True,
        null=True,
        verbose_name=_('Из команды'),
        help_text=_('Если игрок свободный агент, поле может быть пустым')
    )
    
    # 4. В команду
    to_club = models.ForeignKey(
        Club,
        on_delete=models.CASCADE,
        related_name='incoming_transfers',
        verbose_name=_('В команду'),
        help_text=_('Куда перешёл игрок')
    )
    
    # 5. Дата перехода
    transfer_date = models.DateField(
        verbose_name=_('Дата перехода'),
        help_text=_('ДД-ММ-ГГГГ Когда состоялся переход')
    )
    
    # 6. Статус трансфера
    status = models.CharField(
        max_length=20,
        choices=TransferStatus.choices,
        default=TransferStatus.PENDING,
        verbose_name=_('Статус трансфера')
    )
    
    # Дополнительные поля
    transfer_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        verbose_name=_('Сумма трансфера'),
        help_text=_('В долларах США')
    )
    
    season = models.ForeignKey(
        Season,
        on_delete=models.CASCADE,
        related_name='transfers',
        blank=True,
        null=True,
        verbose_name=_('Сезон'),
        help_text=_('В каком сезоне произошел трансфер')
    )
    
    notes = models.TextField(
        blank=True,
        verbose_name=_('Примечания'),
        help_text=_('Дополнительная информация о трансфере')
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
        verbose_name = _('Трансфер игрока')
        verbose_name_plural = _('Трансферы игроков')
        ordering = ['-transfer_date']
    
    def __str__(self):
        from_club_name = getattr(self.from_club, 'name', 'Свободный агент')
        to_club_name = getattr(self.to_club, 'name', 'Неизвестно')
        return f"{self.player.full_name}: {from_club_name} → {to_club_name}"
    
    def save(self, *args, **kwargs):
        # При создании трансфера автоматически обновляем команду игрока
        if self.status == self.TransferStatus.CONFIRMED:
            self.player.club = self.to_club
            self.player.save()
        super().save(*args, **kwargs)
    
    def apply_if_confirmed(self):
        """Применить трансфер, если он подтвержден."""
        if self.status == self.TransferStatus.CONFIRMED:
            self.player.club = self.to_club
            self.player.save()
            return True
        return False