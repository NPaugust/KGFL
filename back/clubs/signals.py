from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Club, ClubSeason
from core.models import Season


@receiver(post_save, sender=Club)
def create_club_season_for_active_season(sender, instance, created, **kwargs):
    """Создаем ClubSeason запись для нового клуба в активном сезоне."""
    # Только при создании нового клуба И если клуб активен
    # НО: если сезон уже был указан при создании через API, сигнал не должен перезаписывать его
    if created and instance.status == 'active':
        # Проверяем, есть ли уже ClubSeason записи для этого клуба
        # Если есть, значит сезон уже был указан при создании через API
        existing_seasons = ClubSeason.objects.filter(club=instance)
        if existing_seasons.exists():
            return
        
        # ОТКЛЮЧЕНО: Не создаем автоматически ClubSeason для активного сезона
        # Клубы должны быть явно добавлены в сезон через админку с указанием сезона
        pass


# ОТКЛЮЧЕН: Автоматическое создание ClubSeason для всех активных клубов при создании нового сезона
# Это приводит к тому, что все клубы появляются во всех сезонах
# ClubSeason записи должны создаваться только при создании клуба с указанием сезона или при создании матча
# @receiver(post_save, sender=Season)
# def create_club_seasons_for_new_season(sender, instance, created, **kwargs):
#     """Создаем ClubSeason записи для всех активных клубов при создании нового сезона."""
#     if created:
#         active_clubs = Club.objects.filter(status='active')
#         for club in active_clubs:
#             club_season, created = ClubSeason.objects.get_or_create(
#                 club=club,
#                 season=instance,
#                 defaults={
#                     'position': 0,
#                     'points': 0,
#                     'matches_played': 0,
#                     'wins': 0,
#                     'draws': 0,
#                     'losses': 0,
#                     'goals_for': 0,
#                     'goals_against': 0,
#                     'goal_difference': 0
#                 }
#             )
#             if created:
#                 print(f"✅ Создана ClubSeason запись для {club.name} в сезоне {instance.name}")
