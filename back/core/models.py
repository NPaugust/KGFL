from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Кастомная модель пользователя для KGFL - только админ."""
    
    # Убираем все роли, оставляем только админа
    is_admin = models.BooleanField(
        default=True,
        verbose_name=_('Администратор')
    )
    
    phone = models.CharField(
        max_length=20,
        blank=True,
        verbose_name=_('Телефон')
    )
    
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True,
        verbose_name=_('Аватар')
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
        verbose_name = _('Пользователь')
        verbose_name_plural = _('Пользователи')
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.username} (Администратор)"
    
    @property
    def is_admin(self):
        return True  # Всегда админ
    
    @property
    def is_moderator(self):
        return True  # Всегда модератор
    
    @property
    def is_editor(self):
        return True  # Всегда редактор


class Season(models.Model):
    """Модель сезона."""
    
    name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name=_('Название')
    )
    
    start_date = models.DateField(
        blank=True,
        null=True,
        verbose_name=_('Дата начала')
    )
    
    end_date = models.DateField(
        blank=True,
        null=True,
        verbose_name=_('Дата окончания')
    )
    
    is_active = models.BooleanField(
        default=False,
        verbose_name=_('Активный сезон')
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
        verbose_name = _('Сезон')
        verbose_name_plural = _('Сезоны')
        ordering = ['-start_date']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        # Сохраняем сезон (деактивация других сезонов обрабатывается сигналом)
        super().save(*args, **kwargs)


class Partner(models.Model):
    """Модель партнера."""
    
    class Category(models.TextChoices):
        MAIN = 'main', _('Главный партнер')
        OFFICIAL = 'official', _('Официальный партнер')
        TECHNICAL = 'technical', _('Технический партнер')
    
    name = models.CharField(
        max_length=200,
        blank=True,
        verbose_name=_('Название')
    )
    
    logo = models.ImageField(
        upload_to='partners/',
        blank=True,
        null=True,
        verbose_name=_('Логотип (необязательно)')
    )
    
    category = models.CharField(
        max_length=20,
        choices=Category.choices,
        default=Category.OFFICIAL,
        blank=True,
        verbose_name=_('Категория')
    )
    
    website = models.URLField(
        blank=True,
        verbose_name=_('Веб-сайт')
    )
    
    description = models.TextField(
        blank=True,
        verbose_name=_('Описание')
    )
    
    is_active = models.BooleanField(
        default=True,
        verbose_name=_('Активен')
    )
    
    order = models.PositiveIntegerField(
        default=0,
        verbose_name=_('Порядок')
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
        verbose_name = _('Партнер')
        verbose_name_plural = _('Партнеры')
        ordering = ['order', 'name']
    
    def __str__(self):
        return self.name


class MediaType(models.TextChoices):
    """Типы медиа файлов."""
    IMAGE = 'image', _('Изображение')
    VIDEO = 'video', _('Видео')
    DOCUMENT = 'document', _('Документ')


class Media(models.Model):
    """Модель для медиа файлов."""
    
    title = models.CharField(
        max_length=200,
        verbose_name=_('Название')
    )
    
    file = models.FileField(
        upload_to='media/',
        blank=True,
        null=True,
        verbose_name=_('Файл (необязательно)')
    )
    
    preview = models.ImageField(
        upload_to='media/previews/',
        blank=True,
        null=True,
        verbose_name=_('Превью (для видео/документов)')
    )
    
    media_type = models.CharField(
        max_length=20,
        choices=MediaType.choices,
        default=MediaType.IMAGE,
        verbose_name=_('Тип медиа')
    )
    
    url = models.URLField(
        blank=True,
        verbose_name=_('Внешняя ссылка (для видео)')
    )
    
    description = models.TextField(
        blank=True,
        verbose_name=_('Описание')
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
        verbose_name = _('Медиа файл')
        verbose_name_plural = _('Медиа файлы')
        ordering = ['-created_at']
    
    def __str__(self):
        return self.title