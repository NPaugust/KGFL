from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Club, ClubSeason
from core.models import Season


@receiver(post_save, sender=Club)
def create_club_season_for_active_season(sender, instance, created, **kwargs):
    """Создаем ClubSeason запись для нового клуба в активном сезоне."""
    if created and instance.status == 'active':
        try:
            active_season = Season.objects.get(is_active=True)
            club_season, created = ClubSeason.objects.get_or_create(
                club=instance,
                season=active_season,
                defaults={
                    'position': 0,
                    'points': 0,
                    'matches_played': 0,
                    'wins': 0,
                    'draws': 0,
                    'losses': 0,
                    'goals_for': 0,
                    'goals_against': 0,
                    'goal_difference': 0
                }
            )
            if created:
                print(f"✅ Автоматически создана ClubSeason запись для {instance.name}")
        except Season.DoesNotExist:
            print(f"❌ Нет активного сезона для создания ClubSeason для {instance.name}")


@receiver(post_save, sender=Season)
def create_club_seasons_for_new_season(sender, instance, created, **kwargs):
    """Создаем ClubSeason записи для всех активных клубов при создании нового сезона."""
    if created:
        active_clubs = Club.objects.filter(status='active')
        for club in active_clubs:
            club_season, created = ClubSeason.objects.get_or_create(
                club=club,
                season=instance,
                defaults={
                    'position': 0,
                    'points': 0,
                    'matches_played': 0,
                    'wins': 0,
                    'draws': 0,
                    'losses': 0,
                    'goals_for': 0,
                    'goals_against': 0,
                    'goal_difference': 0
                }
            )
            if created:
                print(f"✅ Создана ClubSeason запись для {club.name} в сезоне {instance.name}")
