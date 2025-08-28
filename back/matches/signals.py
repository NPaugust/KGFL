from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Match
from clubs.models import ClubSeason
from core.models import Season


@receiver(post_save, sender=Match)
def update_club_stats_on_match_save(sender, instance, created, **kwargs):
    """Обновить статистику клубов при сохранении матча."""
    if instance.status == 'finished':
        try:
            # Получаем активный сезон
            active_season = Season.objects.get(is_active=True)
            
            # Обновляем статистику домашней команды
            home_club_season, _ = ClubSeason.objects.get_or_create(
                club=instance.home_team,
                season=active_season,
                defaults={
                    'points': 0,
                    'matches_played': 0,
                    'wins': 0,
                    'draws': 0,
                    'losses': 0,
                    'goals_for': 0,
                    'goals_against': 0
                }
            )
            
            # Обновляем статистику гостевой команды
            away_club_season, _ = ClubSeason.objects.get_or_create(
                club=instance.away_team,
                season=active_season,
                defaults={
                    'points': 0,
                    'matches_played': 0,
                    'wins': 0,
                    'draws': 0,
                    'losses': 0,
                    'goals_for': 0,
                    'goals_against': 0
                }
            )
            
            # Обновляем статистику на основе результата матча
            if instance.home_score is not None and instance.away_score is not None:
                home_club_season.update_stats_from_match(instance)
                away_club_season.update_stats_from_match(instance)
                
                # Обновляем позиции в таблице
                update_table_positions(active_season)
                
        except Season.DoesNotExist:
            pass


@receiver(post_delete, sender=Match)
def update_club_stats_on_match_delete(sender, instance, **kwargs):
    """Обновить статистику клубов при удалении матча."""
    if instance.status == 'finished':
        try:
            active_season = Season.objects.get(is_active=True)
            
            # Сбрасываем статистику и пересчитываем все матчи
            ClubSeason.objects.filter(season=active_season).update(
                points=0,
                matches_played=0,
                wins=0,
                draws=0,
                losses=0,
                goals_for=0,
                goals_against=0
            )
            
            # Пересчитываем статистику на основе всех завершенных матчей
            finished_matches = Match.objects.filter(
                season=active_season,
                status='finished'
            )
            
            for match in finished_matches:
                home_club_season = ClubSeason.objects.get(
                    club=match.home_team,
                    season=active_season
                )
                away_club_season = ClubSeason.objects.get(
                    club=match.away_team,
                    season=active_season
                )
                
                home_club_season.update_stats_from_match(match)
                away_club_season.update_stats_from_match(match)
            
            # Обновляем позиции в таблице
            update_table_positions(active_season)
            
        except Season.DoesNotExist:
            pass


def update_table_positions(season):
    """Обновить позиции команд в турнирной таблице."""
    club_seasons = ClubSeason.objects.filter(season=season).order_by(
        '-points',
        '-goal_difference',
        '-goals_for',
        'goals_against'
    )
    
    for position, club_season in enumerate(club_seasons, 1):
        club_season.position = position
        club_season.save() 