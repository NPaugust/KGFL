import os
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Match
from clubs.models import ClubSeason
from core.models import Season


def update_player_stats_for_match(match):
    """Обновить статистику игроков на основе матча."""
    try:
        from players.models import PlayerStats, Player
        
        if not match.season or match.home_score is None or match.away_score is None:
            return
            
        # Получаем игроков команд (всех, не только активных)
        home_players = Player.objects.filter(club=match.home_team)
        away_players = Player.objects.filter(club=match.away_team)
        
        # Распределяем голы между игроками команды (упрощенная логика)
        # В реальности голы должны назначаться конкретным игрокам
        if match.home_score > 0 and home_players.exists():
            # Назначаем голы случайным игрокам домашней команды
            for i in range(match.home_score):
                player = home_players[i % home_players.count()]  # Циклично назначаем
                stats, created = PlayerStats.objects.get_or_create(
                    player=player,
                    season=match.season,
                    defaults={
                        'matches_played': 0, 'matches_started': 0, 'minutes_played': 0,
                        'goals': 0, 'assists': 0, 'yellow_cards': 0, 'red_cards': 0, 'clean_sheets': 0
                    }
                )
                stats.goals += 1
                stats.save()
                
        if match.away_score > 0 and away_players.exists():
            # Назначаем голы случайным игрокам гостевой команды
            for i in range(match.away_score):
                player = away_players[i % away_players.count()]  # Циклично назначаем
                stats, created = PlayerStats.objects.get_or_create(
                    player=player,
                    season=match.season,
                    defaults={
                        'matches_played': 0, 'matches_started': 0, 'minutes_played': 0,
                        'goals': 0, 'assists': 0, 'yellow_cards': 0, 'red_cards': 0, 'clean_sheets': 0
                    }
                )
                stats.goals += 1
                stats.save()
        
        print(f"🎯 Обновлена статистика игроков для матча {match.home_team} {match.home_score}:{match.away_score} {match.away_team}")
    except Exception as e:
        print(f"❌ Ошибка при обновлении статистики игроков: {e}")


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
    Обновляет статистику клубов после создания или изменения матча.
    """
    # Проверяем нужно ли сбросить данные при смене статуса на "неактивный"
    if instance.status in ['scheduled', 'cancelled', 'postponed']:
        # Для неактивных статусов удаляем события матча
        if instance.home_score is not None or instance.away_score is not None:
            print(f" Сброс данных для матча со статусом '{instance.status}'")
            try:
                # Удаляем события матча
                from .models import Goal, Card, Substitution
                Goal.objects.filter(match=instance).delete()
                Card.objects.filter(match=instance).delete() 
                Substitution.objects.filter(match=instance).delete()
                print(f" События матча удалены")
                
                # Сбрасываем счет через прямой UPDATE (без вызова save())
                Match.objects.filter(id=instance.id).update(home_score=None, away_score=None)
                # Обновляем instance для дальнейшей обработки
                instance.home_score = None
                instance.away_score = None
            except Exception as e:
                print(f" Ошибка при сбросе данных матча: {e}")
                # Продолжаем выполнение, не прерываем
    
    # Обновляем статистику для матчей с заполненным счетом
    if instance.season and instance.home_team and instance.away_team and instance.home_score is not None and instance.away_score is not None:
        # Перерасчитываем ВСЮ статистику с нуля для этого сезона
        from clubs.models import ClubSeason
        
        # Сбрасываем статистику для всех команд в сезоне
        ClubSeason.objects.filter(season=instance.season).update(
            points=0,
            games=0,
            matches_played=0,
            wins=0,
            draws=0,
            losses=0,
            goals_for=0,
            goals_against=0,
            goal_difference=0
        )
        
        # Сбрасываем статистику игроков в сезоне
        from players.models import PlayerStats
        PlayerStats.objects.filter(season=instance.season).update(
            matches_played=0,
            matches_started=0,
            minutes_played=0,
            goals=0,
            assists=0,
            yellow_cards=0,
            red_cards=0,
            clean_sheets=0
        )
        
        # Пересчитываем статистику на основе ВСЕХ матчей с заполненным счетом в сезоне
        finished_matches = Match.objects.filter(
            season=instance.season,
            home_score__isnull=False,
            away_score__isnull=False
        )
        
        for match in finished_matches:
            if match.home_team and match.away_team and match.home_score is not None and match.away_score is not None:
                # Получаем или создаем ClubSeason записи
                home_season, _ = ClubSeason.objects.get_or_create(
                    club=match.home_team,
                    season=instance.season,
                    defaults={
                        'position': 0, 'games': 0, 'matches_played': 0, 'wins': 0, 
                        'draws': 0, 'losses': 0, 'goals_for': 0, 'goals_against': 0, 
                        'goal_difference': 0, 'points': 0
                    }
                )
                away_season, _ = ClubSeason.objects.get_or_create(
                    club=match.away_team,
                    season=instance.season,
                    defaults={
                        'position': 0, 'games': 0, 'matches_played': 0, 'wins': 0, 
                        'draws': 0, 'losses': 0, 'goals_for': 0, 'goals_against': 0, 
                        'goal_difference': 0, 'points': 0
                    }
                )
                
                # Домашняя команда
                home_season.games += 1
                home_season.matches_played += 1
                home_season.goals_for += match.home_score
                home_season.goals_against += match.away_score
                
                if match.home_score > match.away_score:
                    home_season.wins += 1
                    home_season.points += 3
                elif match.home_score == match.away_score:
                    home_season.draws += 1
                    home_season.points += 1
                else:
                    home_season.losses += 1
                    
                home_season.goal_difference = home_season.goals_for - home_season.goals_against
                home_season.save()
                
                # Гостевая команда
                away_season.games += 1
                away_season.matches_played += 1
                away_season.goals_for += match.away_score
                away_season.goals_against += match.home_score
                
                if match.away_score > match.home_score:
                    away_season.wins += 1
                    away_season.points += 3
                elif match.away_score == match.home_score:
                    away_season.draws += 1
                    away_season.points += 1
                else:
                    away_season.losses += 1
                    
                away_season.goal_difference = away_season.goals_for - away_season.goals_against
                away_season.save()
        
        # Обновляем позиции в таблице
        update_table_positions(instance.season)
        
        # Обновляем статистику игроков (создаем фиктивные голы если у игроков есть данные)
        update_player_stats_for_match(instance)
        
        print(f"📊 Пересчитана статистика для сезона {instance.season} после матча {instance.home_team} {instance.home_score}:{instance.away_score} {instance.away_team}")


@receiver(post_delete, sender=Match)
def update_club_stats_on_match_delete(sender, instance, **kwargs):
    """
    Обновляет статистику клубов после удаления матча.
    """
    if instance.status in ['finished', 'live'] and instance.season:
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
            
            # Пересчитываем статистику на основе всех завершенных/живых матчей
            finished_matches = Match.objects.filter(
                season=instance.season,
                status__in=['finished', 'live']
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
                        
                        # Статистика обновляется автоматически через сигнал post_save
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
