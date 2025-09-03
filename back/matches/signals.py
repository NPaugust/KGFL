import os
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Match
from clubs.models import ClubSeason
from core.models import Season


@receiver(post_save, sender=Match)
def create_club_seasons_for_match(sender, instance, created, **kwargs):
    """
    Автоматически создает ClubSeason записи для команд матча, если их нет.
    """
    if instance.season and instance.home_team and instance.away_team:
        # Создаем ClubSeason для домашней команды
        ClubSeason.objects.get_or_create(
            club=instance.home_team,
            season=instance.season,
            defaults={
                'position': 0,
                'games': 0,
                'wins': 0,
                'draws': 0,
                'losses': 0,
                'goals_for': 0,
                'goals_against': 0,
                'goal_difference': 0,
                'points': 0
            }
        )
        
        # Создаем ClubSeason для гостевой команды
        ClubSeason.objects.get_or_create(
            club=instance.away_team,
            season=instance.season,
            defaults={
                'position': 0,
                'games': 0,
                'wins': 0,
                'draws': 0,
                'losses': 0,
                'goals_for': 0,
                'goals_against': 0,
                'goal_difference': 0,
                'points': 0
            }
        )


@receiver(post_save, sender=Match)
def update_club_stats_after_match(sender, instance, created, **kwargs):
    """
    Обновляет статистику клубов после изменения матча.
    """
    if not created and instance.season and instance.status == 'finished' and instance.home_team and instance.away_team:
        # Обновляем статистику только для завершенных матчей
        from clubs.models import ClubSeason
        
        # Получаем или создаем ClubSeason записи
        home_club_season, _ = ClubSeason.objects.get_or_create(
            club=instance.home_team,
            season=instance.season,
            defaults={
                'position': 0,
                'games': 0,
                'wins': 0,
                'draws': 0,
                'losses': 0,
                'goals_for': 0,
                'goals_against': 0,
                'goal_difference': 0,
                'points': 0
            }
        )
        
        away_club_season, _ = ClubSeason.objects.get_or_create(
            club=instance.away_team,
            season=instance.season,
            defaults={
                'position': 0,
                'games': 0,
                'wins': 0,
                'draws': 0,
                'losses': 0,
                'goals_for': 0,
                'goals_against': 0,
                'goal_difference': 0,
                'points': 0
            }
        )
        
        # Обновляем статистику на основе результата матча
        if instance.home_score is not None and instance.away_score is not None:
            # Домашняя команда
            home_club_season.games += 1
            home_club_season.goals_for += instance.home_score
            home_club_season.goals_against += instance.away_score
            
            if instance.home_score > instance.away_score:
                home_club_season.wins += 1
                home_club_season.points += 3
            elif instance.home_score == instance.away_score:
                home_club_season.draws += 1
                home_club_season.points += 1
            else:
                home_club_season.losses += 1
            
            # Рассчитываем разность голов
            home_club_season.goal_difference = home_club_season.goals_for - home_club_season.goals_against
            home_club_season.save()
            
            # Гостевая команда
            away_club_season.games += 1
            away_club_season.goals_for += instance.away_score
            away_club_season.goals_against += instance.home_score
            
            if instance.away_score > instance.home_score:
                away_club_season.wins += 1
                away_club_season.points += 3
            elif instance.away_score == instance.home_score:
                away_club_season.draws += 1
                away_club_season.points += 1
            else:
                away_club_season.losses += 1
            
            # Рассчитываем разность голов
            away_club_season.goal_difference = away_club_season.goals_for - away_club_season.goals_against
            away_club_season.save()
            
            # Обновляем позиции в таблице
            update_table_positions(instance.season)
            
            print(f"📊 Обновлена статистика для матча {instance.home_team} {instance.home_score}:{instance.away_score} {instance.away_team}")


@receiver(post_delete, sender=Match)
def update_club_stats_on_match_delete(sender, instance, **kwargs):
    """
    Обновляет статистику клубов после удаления матча.
    """
    if instance.status == 'finished' and instance.season:
        try:
            # Сбрасываем статистику и пересчитываем все матчи
            ClubSeason.objects.filter(season=instance.season).update(
                points=0,
                games=0,
                wins=0,
                draws=0,
                losses=0,
                goals_for=0,
                goals_against=0,
                goal_difference=0
            )
            
            # Пересчитываем статистику на основе всех завершенных матчей
            finished_matches = Match.objects.filter(
                season=instance.season,
                status='finished'
            )
            
            for match in finished_matches:
                if match.home_team and match.away_team and match.home_score is not None and match.away_score is not None:
                    try:
                        home_club_season = ClubSeason.objects.get(
                            club=match.home_team,
                            season=instance.season
                        )
                        away_club_season = ClubSeason.objects.get(
                            club=match.away_team,
                            season=instance.season
                        )
                        
                        home_club_season.update_stats_from_match(match)
                        away_club_season.update_stats_from_match(match)
                    except ClubSeason.DoesNotExist:
                        continue
            
            # Обновляем позиции в таблице
            update_table_positions(instance.season)
            
        except Exception as e:
            print(f"Ошибка при обновлении статистики после удаления матча: {e}")


def update_table_positions(season):
    """Обновить позиции команд в турнирной таблице."""
    from django.db.models import F, ExpressionWrapper, IntegerField
    
    try:
        club_seasons = (
            ClubSeason.objects
            .filter(season=season)
            .order_by('-points', '-goal_difference', '-goals_for', 'goals_against')
        )
        
        for position, club_season in enumerate(club_seasons, 1):
            club_season.position = position
            club_season.save(update_fields=['position'])
    except Exception as e:
        print(f"Ошибка при обновлении позиций в таблице: {e}") 