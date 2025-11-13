from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.db import models
from django.db.models import Q
from .models import Match, Assist
from clubs.models import ClubSeason
from core.models import Season


def recalculate_season_stats(season):
    """Полностью пересчитать статистику для сезона на основе всех матчей."""
    try:
        
        # Сбрасываем статистику для всех команд в сезоне
        ClubSeason.objects.filter(season=season).update(
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
        PlayerStats.objects.filter(season=season).update(
            matches_played=0,
            matches_started=0,
            minutes_played=0,
            goals=0,
            assists=0,
            yellow_cards=0,
            red_cards=0,
            clean_sheets=0
        )
        
        # Пересчитываем статистику на основе ВСЕХ завершенных матчей в сезоне
        finished_matches = Match.objects.filter(
            season=season,
            home_score__isnull=False,
            away_score__isnull=False,
            status__in=['finished', 'live']
        )
        
        
        for match in finished_matches:
            if match.home_team and match.away_team:
                # Статистика клубов
                home_club_season, _ = ClubSeason.objects.get_or_create(
                    club=match.home_team,
                    season=season,
                    defaults={
                        'position': 0,
                        'points': 0,
                        'games': 0,
                        'matches_played': 0,
                        'wins': 0,
                        'draws': 0,
                        'losses': 0,
                        'goals_for': 0,
                        'goals_against': 0,
                        'goal_difference': 0
                    }
                )
                away_club_season, _ = ClubSeason.objects.get_or_create(
                    club=match.away_team,
                    season=season,
                    defaults={
                        'position': 0,
                        'points': 0,
                        'games': 0,
                        'matches_played': 0,
                        'wins': 0,
                        'draws': 0,
                        'losses': 0,
                        'goals_for': 0,
                        'goals_against': 0,
                        'goal_difference': 0
                    }
                )
                
                home_club_season.games += 1
                home_club_season.matches_played += 1
                away_club_season.games += 1
                away_club_season.matches_played += 1
                
                home_club_season.goals_for += match.home_score
                home_club_season.goals_against += match.away_score
                away_club_season.goals_for += match.away_score
                away_club_season.goals_against += match.home_score
                
                if match.home_score > match.away_score:
                    home_club_season.wins += 1
                    home_club_season.points += 3
                    away_club_season.losses += 1
                elif match.away_score > match.home_score:
                    away_club_season.wins += 1
                    away_club_season.points += 3
                    home_club_season.losses += 1
                else:
                    home_club_season.draws += 1
                    home_club_season.points += 1
                    away_club_season.draws += 1
                    away_club_season.points += 1
                    
                home_club_season.goal_difference = home_club_season.goals_for - home_club_season.goals_against
                away_club_season.goal_difference = away_club_season.goals_for - away_club_season.goals_against
                
                home_club_season.save()
                away_club_season.save()
                
                # Статистика игроков
                recalculate_player_stats_for_season(season)
        
        # Обновляем позиции
        update_table_positions(season)
        
        
    except Exception as e:
        import traceback
        traceback.print_exc()


def recalculate_player_stats_for_season(season):
    """Полностью пересчитать статистику всех игроков для сезона."""
    try:
        from players.models import PlayerStats, Player
        from .models import Goal, Card, Assist
        
        if not season:
            return
        
        
        # Получаем всех игроков, которые играют в этом сезоне
        players_in_season = Player.objects.filter(season=season).distinct()
        
        # Также получаем игроков из матчей этого сезона
        matches_in_season = Match.objects.filter(season=season)
        club_ids = set()
        for match in matches_in_season:
            if match.home_team:
                club_ids.add(match.home_team.id)
            if match.away_team:
                club_ids.add(match.away_team.id)
        
        players_from_matches = Player.objects.filter(club_id__in=club_ids, season=season).distinct()
        all_players = list(set(list(players_in_season) + list(players_from_matches)))
        
        
        # Пересчитываем статистику для каждого игрока
        for player in all_players:
            player_stats, _ = PlayerStats.objects.get_or_create(
                player=player,
                season=season,
                defaults={
                    'matches_played': 0, 'matches_started': 0, 'minutes_played': 0,
                    'goals': 0, 'assists': 0, 'yellow_cards': 0, 'red_cards': 0, 'clean_sheets': 0
                }
            )
            
            # Подсчитываем количество матчей для этого игрока в этом сезоне
            matches_count = Match.objects.filter(
                Q(home_team=player.club) | Q(away_team=player.club),
                season=season,
                status__in=['finished', 'live'],
                home_score__isnull=False,
                away_score__isnull=False
            ).count()
            
            player_stats.matches_played = matches_count
            player_stats.matches_started = matches_count
            player_stats.minutes_played = matches_count * 90
            
            # Пересчитываем голы
            player_stats.goals = Goal.objects.filter(
                scorer=player,
                match__season=season
            ).count()
            
            # Пересчитываем ассисты из Goal
            assists_from_goals = Goal.objects.filter(
                assist=player,
                match__season=season
            ).count()
            
            # Пересчитываем ассисты из Assist
            assists_from_assist = Assist.objects.filter(
                player=player,
                match__season=season
            ).count()
            
            player_stats.assists = assists_from_goals + assists_from_assist
            
            # Пересчитываем карточки
            player_stats.yellow_cards = Card.objects.filter(
                player=player,
                match__season=season,
                card_type='yellow'
            ).count()
            
            player_stats.red_cards = Card.objects.filter(
                player=player,
                match__season=season,
                card_type__in=['red', 'second_yellow']
            ).count()
            
            player_stats.save()
        
        
    except Exception as e:
        import traceback
        traceback.print_exc()


def recalculate_player_stats_for_match(match):
    """Пересчитать статистику игроков для конкретного матча."""
    try:
        from players.models import PlayerStats, Player
        from .models import Goal, Card, Assist
        
        if not match.season:
            return
        
        # Получаем всех игроков команд
        home_players = Player.objects.filter(club=match.home_team, season=match.season)
        away_players = Player.objects.filter(club=match.away_team, season=match.season)
        all_players = list(home_players) + list(away_players)
        
        # Пересчитываем статистику матчей для всех игроков команд
        for player in all_players:
            player_stats, _ = PlayerStats.objects.get_or_create(
                player=player,
                season=match.season,
                defaults={
                    'matches_played': 0, 'matches_started': 0, 'minutes_played': 0,
                    'goals': 0, 'assists': 0, 'yellow_cards': 0, 'red_cards': 0, 'clean_sheets': 0
                }
            )
            
            # Подсчитываем количество матчей для этого игрока в этом сезоне
            matches_count = Match.objects.filter(
                Q(home_team=player.club) | Q(away_team=player.club),
                season=match.season,
                status__in=['finished', 'live'],
                home_score__isnull=False,
                away_score__isnull=False
            ).count()
            
            player_stats.matches_played = matches_count
            player_stats.matches_started = matches_count
            player_stats.minutes_played = matches_count * 90
        
        # Пересчитываем голы из модели Goal
        goals = Goal.objects.filter(match=match)
        for goal in goals:
            scorer_stats, _ = PlayerStats.objects.get_or_create(
                player=goal.scorer,
                season=match.season,
                defaults={
                    'matches_played': 0, 'matches_started': 0, 'minutes_played': 0,
                    'goals': 0, 'assists': 0, 'yellow_cards': 0, 'red_cards': 0, 'clean_sheets': 0
                }
            )
            # Пересчитываем голы для этого игрока в этом сезоне
            scorer_stats.goals = Goal.objects.filter(scorer=goal.scorer, match__season=match.season).count()
            scorer_stats.save()
            
            if goal.assist:
                assist_stats, _ = PlayerStats.objects.get_or_create(
                    player=goal.assist,
                    season=match.season,
                    defaults={
                        'matches_played': 0, 'matches_started': 0, 'minutes_played': 0,
                        'goals': 0, 'assists': 0, 'yellow_cards': 0, 'red_cards': 0, 'clean_sheets': 0
                    }
                )
                # Пересчитываем ассисты из Goal
                assist_stats.assists = Goal.objects.filter(assist=goal.assist, match__season=match.season).count()
                assist_stats.save()
        
        # Пересчитываем ассисты из отдельной таблицы Assist
        assists = Assist.objects.filter(match=match)
        for assist in assists:
            assist_stats, _ = PlayerStats.objects.get_or_create(
                player=assist.player,
                season=match.season,
                defaults={
                    'matches_played': 0, 'matches_started': 0, 'minutes_played': 0,
                    'goals': 0, 'assists': 0, 'yellow_cards': 0, 'red_cards': 0, 'clean_sheets': 0
                }
            )
            # Пересчитываем ассисты из Assist для этого игрока в этом сезоне
            assist_stats.assists = Assist.objects.filter(player=assist.player, match__season=match.season).count()
            assist_stats.save()
        
        # Пересчитываем карточки
        cards = Card.objects.filter(match=match)
        for card in cards:
            player_stats, _ = PlayerStats.objects.get_or_create(
                player=card.player,
                season=match.season,
                defaults={
                    'matches_played': 0, 'matches_started': 0, 'minutes_played': 0,
                    'goals': 0, 'assists': 0, 'yellow_cards': 0, 'red_cards': 0, 'clean_sheets': 0
                }
            )
            
            # Пересчитываем карточки для этого игрока в этом сезоне
            player_stats.yellow_cards = Card.objects.filter(
                player=card.player,
                match__season=match.season,
                card_type='yellow'
            ).count()
            
            player_stats.red_cards = Card.objects.filter(
                player=card.player,
                match__season=match.season,
                card_type__in=['red', 'second_yellow']
            ).count()
            
            player_stats.save()
        
    except Exception as e:
        import traceback
        traceback.print_exc()


def update_matches_played_for_players(match):
    """Обновить статистику сыгранных матчей для игроков."""
    try:
        from players.models import PlayerStats, Player
        
        if not match.season or match.home_score is None or match.away_score is None:
            return
        
        # Получаем всех игроков команд
        home_players = Player.objects.filter(club=match.home_team)
        away_players = Player.objects.filter(club=match.away_team)
        all_players = list(home_players) + list(away_players)
        
        # Пересчитываем статистику матчей для всех игроков команд
        for player in all_players:
            player_stats, _ = PlayerStats.objects.get_or_create(
                player=player,
                season=match.season,
                defaults={
                    'matches_played': 0, 'matches_started': 0, 'minutes_played': 0,
                    'goals': 0, 'assists': 0, 'yellow_cards': 0, 'red_cards': 0, 'clean_sheets': 0
                }
            )
            
            # Подсчитываем количество матчей для этого игрока в этом сезоне
            matches_count = Match.objects.filter(
                Q(home_team=player.club) | Q(away_team=player.club),
                season=match.season,
                status__in=['finished', 'live'],
                home_score__isnull=False,
                away_score__isnull=False
            ).count()
            
            player_stats.matches_played = matches_count
            player_stats.matches_started = matches_count
            player_stats.minutes_played = matches_count * 90
            player_stats.save()
        
    except Exception as e:
        pass


def update_player_stats_for_match(match):
    """Обновить статистику игроков на основе матча."""
    try:
        from players.models import PlayerStats, Player
        from .models import Goal, Card, Assist
        
        if not match.season or match.home_score is None or match.away_score is None:
            return
        
        # Проверяем, не обновляли ли мы этот матч уже
        if not hasattr(update_player_stats_for_match, '_processed_matches'):
            update_player_stats_for_match._processed_matches = set()
        
        if match.id in update_player_stats_for_match._processed_matches:
            return
        
        update_player_stats_for_match._processed_matches.add(match.id)
        
        
        # Получаем всех игроков команд
        home_players = Player.objects.filter(club=match.home_team)
        away_players = Player.objects.filter(club=match.away_team)
        all_players = list(home_players) + list(away_players)
        
        # 1. Голы и ассисты из модели Goal
        goals = Goal.objects.filter(match=match)
        
        for goal in goals:
            # Статистика забившего
            scorer_stats, _ = PlayerStats.objects.get_or_create(
                player=goal.scorer,
                season=match.season,
                defaults={
                    'matches_played': 0, 'matches_started': 0, 'minutes_played': 0,
                    'goals': 0, 'assists': 0, 'yellow_cards': 0, 'red_cards': 0, 'clean_sheets': 0
                }
            )
            scorer_stats.goals += 1
            scorer_stats.save()
            
            # Статистика ассистента (если есть)
            if goal.assist:
                assist_stats, _ = PlayerStats.objects.get_or_create(
                    player=goal.assist,
                    season=match.season,
                    defaults={
                        'matches_played': 0, 'matches_started': 0, 'minutes_played': 0,
                        'goals': 0, 'assists': 0, 'yellow_cards': 0, 'red_cards': 0, 'clean_sheets': 0
                    }
                )
                assist_stats.assists += 1
                assist_stats.save()
                
        # 2. Ассисты из отдельной таблицы Assist
        assists = Assist.objects.filter(match=match)
        
        for assist in assists:
            assist_stats, _ = PlayerStats.objects.get_or_create(
                player=assist.player,
                season=match.season,
                defaults={
                    'matches_played': 0, 'matches_started': 0, 'minutes_played': 0,
                    'goals': 0, 'assists': 0, 'yellow_cards': 0, 'red_cards': 0, 'clean_sheets': 0
                }
            )
            assist_stats.assists += 1
            assist_stats.save()
            
        # 3. Карточки
        cards = Card.objects.filter(match=match)
        
        for card in cards:
            player_stats, _ = PlayerStats.objects.get_or_create(
                player=card.player,
                season=match.season,
                defaults={
                    'matches_played': 0, 'matches_started': 0, 'minutes_played': 0,
                    'goals': 0, 'assists': 0, 'yellow_cards': 0, 'red_cards': 0, 'clean_sheets': 0
                }
            )
            
            if card.card_type == 'yellow':
                player_stats.yellow_cards += 1
                
            player_stats.save()
        
        # 4. Сыгранные матчи для всех игроков команд
        for player in all_players:
            player_stats, _ = PlayerStats.objects.get_or_create(
                player=player,
                season=match.season,
                defaults={
                    'matches_played': 0, 'matches_started': 0, 'minutes_played': 0,
                    'goals': 0, 'assists': 0, 'yellow_cards': 0, 'red_cards': 0, 'clean_sheets': 0
                }
            )
            player_stats.matches_played += 1
            player_stats.matches_started += 1
            player_stats.minutes_played += 90
            player_stats.save()
        
        
    except Exception as e:
        pass


def update_club_and_player_stats(instance):
    """Обновляет статистику клубов и игроков для конкретного матча."""
    try:
        
        # Обновляем статистику только для конкретного матча
        if instance.home_team and instance.away_team and instance.home_score is not None and instance.away_score is not None:
            home_club_season, _ = ClubSeason.objects.get_or_create(
                club=instance.home_team,
                season=instance.season
            )
            away_club_season, _ = ClubSeason.objects.get_or_create(
                club=instance.away_team,
                season=instance.season
            )
            
            home_club_season.games += 1
            away_club_season.games += 1
            
            home_club_season.goals_for += instance.home_score
            home_club_season.goals_against += instance.away_score
            away_club_season.goals_for += instance.away_score
            away_club_season.goals_against += instance.home_score
            
            if instance.home_score > instance.away_score:
                home_club_season.wins += 1
                home_club_season.points += 3
                away_club_season.losses += 1
            elif instance.away_score > instance.home_score:
                away_club_season.wins += 1
                away_club_season.points += 3
                home_club_season.losses += 1
            else:
                home_club_season.draws += 1
                home_club_season.points += 1
                away_club_season.draws += 1
                away_club_season.points += 1
                
            home_club_season.goal_difference = home_club_season.goals_for - home_club_season.goals_against
            away_club_season.goal_difference = away_club_season.goals_for - away_club_season.goals_against
            
            home_club_season.save()
            away_club_season.save()
        
        update_table_positions(instance.season)
        
        
    except Exception as e:
        pass


def update_table_positions(season):
    """Обновить позиции команд в таблице."""
    try:
        club_seasons = ClubSeason.objects.filter(season=season).order_by(
            '-points', '-goal_difference', '-goals_for'
        )
        
        for position, club_season in enumerate(club_seasons, 1):
            club_season.position = position
            club_season.save()
            
            
    except Exception as e:
        pass


@receiver(post_save, sender=Match)
def handle_match_save(sender, instance, created, **kwargs):
    """
    Обрабатывает сохранение матча: создает ClubSeason и обновляет статистику.
    """
    if instance.season and instance.home_team and instance.away_team:
        # Если счет сброшен (0:0), удаляем все события
        if instance.home_score == 0 and instance.away_score == 0:
            from .models import Goal, Card, Assist
            Goal.objects.filter(match=instance).delete()
            Card.objects.filter(match=instance).delete()
            Assist.objects.filter(match=instance).delete()
        
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
        
        # Если это обновление (не создание), проверяем, изменился ли сезон
        if not created:
            # Получаем старый сезон из базы данных, если матч уже существует
            try:
                old_match = Match.objects.get(pk=instance.pk)
                old_season = old_match.season if hasattr(old_match, 'season') else None
                
                # Если сезон изменился, пересчитываем статистику для обоих сезонов
                if old_season and old_season != instance.season:
                    # Пересчитываем статистику для старого сезона (без этого матча)
                    recalculate_season_stats(old_season)
                    # Пересчитываем статистику для нового сезона (с этим матчом)
                    recalculate_season_stats(instance.season)
                    return
                
                # Если счет изменился или статус изменился, пересчитываем статистику
                if (old_match.home_score != instance.home_score or 
                    old_match.away_score != instance.away_score or 
                    old_match.status != instance.status):
                    # Пересчитываем статистику для текущего сезона
                    recalculate_season_stats(instance.season)
                    return
            except Match.DoesNotExist:
                pass  # Матч не существует в БД, значит это создание
        
        # Обновляем статистику только для завершенных матчей
        if instance.status in ['finished', 'live'] and instance.home_score is not None and instance.away_score is not None:
            # Для нового матча просто пересчитываем статистику сезона
            recalculate_season_stats(instance.season)


@receiver(post_delete, sender=Match)
def update_club_stats_on_match_delete(sender, instance, **kwargs):
    """
    Обновляет статистику клубов после удаления матча.
    """
    if instance.season:
        try:
            # Полностью пересчитываем статистику сезона
            recalculate_season_stats(instance.season)
            
        except Exception as e:
            import traceback
            traceback.print_exc()


# Сигнал для ассистов перенесен в players/signals.py
