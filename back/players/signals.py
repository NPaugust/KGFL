from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Player, PlayerStats, PlayerTransfer
from matches.models import Goal, Card, Substitution, Assist
from core.models import Season


@receiver(post_save, sender=Goal)
def update_player_stats_on_goal(sender, instance, created, **kwargs):
    """Обновить статистику игрока при забитом голе."""
    if created:
        player = instance.scorer
        match = instance.match
        
        # Получаем или создаем статистику игрока для сезона
        season = match.season
        if season:
            stats, created = PlayerStats.objects.get_or_create(
                player=player,
                season=season,
                defaults={
                    'matches_played': 0,
                    'matches_started': 0,
                    'minutes_played': 0,
                    'goals': 0,
                    'assists': 0,
                    'yellow_cards': 0,
                    'red_cards': 0,
                    'clean_sheets': 0,
                }
            )
            stats.goals += 1
            stats.save()
        
        # Обновляем статистику ассистента, если есть
        if instance.assist:
            assist_stats, created = PlayerStats.objects.get_or_create(
                player=instance.assist,
                season=season,
                defaults={
                    'matches_played': 0,
                    'matches_started': 0,
                    'minutes_played': 0,
                    'goals': 0,
                    'assists': 0,
                    'yellow_cards': 0,
                    'red_cards': 0,
                    'clean_sheets': 0,
                }
            )
            assist_stats.assists += 1
            assist_stats.save()


@receiver(post_save, sender=Card)
def update_player_stats_on_card(sender, instance, created, **kwargs):
    """Обновить статистику игрока при получении карточки."""
    if created:
        player = instance.player
        match = instance.match
        season = match.season
        
        if season:
            stats, created = PlayerStats.objects.get_or_create(
                player=player,
                season=season,
                defaults={
                    'matches_played': 0,
                    'matches_started': 0,
                    'minutes_played': 0,
                    'goals': 0,
                    'assists': 0,
                    'yellow_cards': 0,
                    'red_cards': 0,
                    'clean_sheets': 0,
                }
            )
            
            if instance.card_type == 'yellow':
                stats.yellow_cards += 1
            elif instance.card_type in ['red', 'second_yellow']:
                stats.red_cards += 1
            
            stats.save()


@receiver(post_save, sender=Substitution)
def update_player_stats_on_substitution(sender, instance, created, **kwargs):
    """Обновить статистику игроков при замене."""
    if created:
        match = instance.match
        season = match.season
        
        if season:
            # Игрок, который вышел
            player_out_stats, created = PlayerStats.objects.get_or_create(
                player=instance.player_out,
                season=season,
                defaults={
                    'matches_played': 0,
                    'matches_started': 0,
                    'minutes_played': 0,
                    'goals': 0,
                    'assists': 0,
                    'yellow_cards': 0,
                    'red_cards': 0,
                    'clean_sheets': 0,
                }
            )
            player_out_stats.matches_played += 1
            player_out_stats.minutes_played += instance.minute
            player_out_stats.save()
            
            # Игрок, который вошел
            player_in_stats, created = PlayerStats.objects.get_or_create(
                player=instance.player_in,
                season=season,
                defaults={
                    'matches_played': 0,
                    'matches_started': 0,
                    'minutes_played': 0,
                    'goals': 0,
                    'assists': 0,
                    'yellow_cards': 0,
                    'red_cards': 0,
                    'clean_sheets': 0,
                }
            )
            player_in_stats.matches_played += 1
            player_in_stats.minutes_played += (90 - instance.minute)  # Предполагаем, что матч длится 90 минут
            player_in_stats.save()


@receiver(post_save, sender=Assist)
def update_player_stats_on_assist(sender, instance, created, **kwargs):
    """Обновить статистику игрока при создании ассиста."""
    if created:
        player = instance.player
        match = instance.match
        season = match.season
        
        if season:
            stats, created = PlayerStats.objects.get_or_create(
                player=player,
                season=season,
                defaults={
                    'matches_played': 0,
                    'matches_started': 0,
                    'minutes_played': 0,
                    'goals': 0,
                    'assists': 0,
                    'yellow_cards': 0,
                    'red_cards': 0,
                    'clean_sheets': 0,
                }
            )
            stats.assists += 1
            stats.save()


@receiver(post_delete, sender=Goal)
def update_player_stats_on_goal_delete(sender, instance, **kwargs):
    """Обновить статистику игрока при удалении гола."""
    player = instance.scorer
    match = instance.match
    season = match.season
    if season:
        try:
            stats = PlayerStats.objects.get(player=player, season=season)
            stats.goals = max(0, stats.goals - 1)
            stats.save()
        except PlayerStats.DoesNotExist:
            pass
    
    # Обновляем статистику ассистента, если есть
    if instance.assist:
        try:
            assist_stats = PlayerStats.objects.get(player=instance.assist, season=season)
            assist_stats.assists = max(0, assist_stats.assists - 1)
            assist_stats.save()
        except PlayerStats.DoesNotExist:
            pass


@receiver(post_delete, sender=Assist)
def update_player_stats_on_assist_delete(sender, instance, **kwargs):
    """Обновить статистику игрока при удалении ассиста."""
    player = instance.player
    match = instance.match
    season = match.season
    if season:
        try:
            stats = PlayerStats.objects.get(player=player, season=season)
            stats.assists = max(0, stats.assists - 1)
            stats.save()
        except PlayerStats.DoesNotExist:
            pass


@receiver(post_delete, sender=Card)
def update_player_stats_on_card_delete(sender, instance, **kwargs):
    """Обновить статистику игрока при удалении карточки."""
    player = instance.player
    match = instance.match
    season = match.season
    if season:
        try:
            stats = PlayerStats.objects.get(player=player, season=season)
            if instance.card_type == 'yellow':
                stats.yellow_cards = max(0, stats.yellow_cards - 1)
            elif instance.card_type in ['red', 'second_yellow']:
                stats.red_cards = max(0, stats.red_cards - 1)
            stats.save()
        except PlayerStats.DoesNotExist:
            pass


@receiver(post_save, sender=PlayerTransfer)
def update_player_club_on_transfer(sender, instance, created, **kwargs):
    """Обновить команду игрока при подтверждении трансфера."""
    if instance.status == PlayerTransfer.TransferStatus.CONFIRMED:
        instance.apply_if_confirmed()
