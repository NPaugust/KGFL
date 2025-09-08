from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Season
from clubs.models import Club, ClubSeason


@receiver(post_save, sender=Season)
def create_club_seasons_for_active_season(sender, instance, created, **kwargs):
    """
    Автоматически создает ClubSeason записи для всех клубов при создании активного сезона.
    Это гарантирует, что все клубы будут отображаться в таблице нового сезона.
    """
    if instance.is_active:
        # Получаем все существующие клубы
        clubs = Club.objects.all()
        
        # Создаем ClubSeason записи для каждого клуба с нулевой статистикой
        for club in clubs:
            ClubSeason.objects.get_or_create(
                club=club,
                season=instance,
                defaults={
                    'points': 0,
                    'matches_played': 0,
                    'wins': 0,
                    'draws': 0,
                    'losses': 0,
                    'goals_for': 0,
                    'goals_against': 0,
                    'position': None
                }
            )
        
        print(f"✅ Созданы ClubSeason записи для {clubs.count()} клубов в сезоне '{instance.name}'")


@receiver(post_save, sender=Season)
def deactivate_other_seasons(sender, instance, created, **kwargs):
    """
    Деактивирует все остальные сезоны при активации нового.
    """
    if instance.is_active:
        # Деактивируем все остальные сезоны
        Season.objects.exclude(pk=instance.pk).update(is_active=False)
        print(f"🔄 Деактивированы все остальные сезоны. Активен: '{instance.name}'")


# Убираем автоматическое создание ClubSeason записей
# Клубы должны существовать независимо от сезонов
# ClubSeason записи будут создаваться только при создании матчей
