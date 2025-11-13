from rest_framework import viewsets, permissions
import rest_framework.parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Player, PlayerStats, PlayerTransfer
from .serializers import (
    PlayerSerializer, PlayerListSerializer, PlayerDetailSerializer,
    PlayerStatsSerializer, TopScorerSerializer, PlayerCreateSerializer,
    PlayerTransferSerializer
)


class PlayerViewSet(viewsets.ModelViewSet):
    """ViewSet для управления игроками."""
    
    queryset = Player.objects.select_related('club', 'season').prefetch_related('stats', 'transfers')
    serializer_class = PlayerSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    parser_classes = [rest_framework.parsers.MultiPartParser, rest_framework.parsers.FormParser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PlayerCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PlayerSerializer
        elif self.action == 'list':
            return PlayerListSerializer
        elif self.action == 'retrieve':
            return PlayerDetailSerializer
        return PlayerSerializer
    
    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

    def get_permissions(self):
        return super().get_permissions()

    def get_queryset(self):
        """Фильтрация игроков по сезону."""
        qs = super().get_queryset()
        
        # Фильтрация по сезону
        season_id = self.request.query_params.get('season')
        
        if season_id:
            qs = qs.filter(season_id=season_id)
        
        return qs

    def get_parsers(self):
        return [
            rest_framework.parsers.MultiPartParser(),
            rest_framework.parsers.FormParser(),
            rest_framework.parsers.JSONParser(),
        ]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            instance.delete()
            return Response(status=204)
        except Exception as e:
            from django.db.models.deletion import ProtectedError
            if isinstance(e, ProtectedError):
                return Response(
                    {'error': 'Невозможно удалить игрока: есть связанные записи (матчи/статистика).'},
                    status=400
                )
            return Response({'error': f'Ошибка при удалении игрока: {str(e)}'}, status=500)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Поиск игроков."""
        query = request.query_params.get('q', '')
        if query:
            players = self.queryset.filter(
                Q(first_name__icontains=query) | 
                Q(last_name__icontains=query) | 
                Q(club__name__icontains=query)
            )
        else:
            players = self.queryset.filter(is_active=True)
        serializer = self.get_serializer(players, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_club(self, request):
        """Получить игроков по клубу."""
        club_id = request.query_params.get('club_id')
        if club_id:
            players = self.queryset.filter(club_id=club_id)
        else:
            players = self.queryset.filter(is_active=True)
        serializer = self.get_serializer(players, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_position(self, request):
        """Получить игроков по позиции."""
        position = request.query_params.get('position')
        if position:
            players = self.queryset.filter(position=position)
        else:
            players = self.queryset.filter(is_active=True)
        serializer = self.get_serializer(players, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def top_scorers(self, request):
        """Получить лучших бомбардиров."""
        limit = int(request.query_params.get('limit', 10))
        from core.models import Season
        
        # Получаем сезон из query параметров, если указан
        season_id = request.query_params.get('season')
        if season_id:
            try:
                season = Season.objects.get(id=season_id)
                season_filter = {'season': season}
            except Season.DoesNotExist:
                season_filter = {}
        else:
            # Если сезон не указан, используем активный сезон
            try:
                active_season = Season.objects.get(is_active=True)
                season_filter = {'season': active_season}
            except Season.DoesNotExist:
                # Если активного сезона нет, не фильтруем по сезону (все сезоны)
                season_filter = {}
        
        top_scorers = PlayerStats.objects.filter(
            goals__gt=0,
            **season_filter
        ).order_by('-goals', '-assists')[:limit]
        serializer = TopScorerSerializer(top_scorers, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Получить статистику игрока."""
        player = self.get_object()
        from core.models import Season
        from django.db.models import Sum, Max
        
        # Получаем сезон из query параметров
        season_id = request.query_params.get('season')
        
        if season_id:
            # Если сезон указан, возвращаем статистику за этот сезон
            try:
                season = Season.objects.get(id=season_id)
                stats = PlayerStats.objects.filter(player=player, season=season).first()
                if stats:
                    serializer = PlayerStatsSerializer(stats)
                    return Response(serializer.data)
            except Season.DoesNotExist:
                pass
        else:
            # Если сезон не указан ("Все сезоны"), возвращаем агрегированную статистику
            all_stats = PlayerStats.objects.filter(player=player).aggregate(
                matches_played=Sum('matches_played') or 0,
                matches_started=Sum('matches_started') or 0,
                minutes_played=Sum('minutes_played') or 0,
                goals=Sum('goals') or 0,
                assists=Sum('assists') or 0,
                yellow_cards=Sum('yellow_cards') or 0,
                red_cards=Sum('red_cards') or 0,
                clean_sheets=Sum('clean_sheets') or 0
            )
            
            # Преобразуем None в 0
            aggregated_stats = {
                'matches_played': all_stats.get('matches_played', 0) or 0,
                'matches_started': all_stats.get('matches_started', 0) or 0,
                'minutes_played': all_stats.get('minutes_played', 0) or 0,
                'goals': all_stats.get('goals', 0) or 0,
                'assists': all_stats.get('assists', 0) or 0,
                'yellow_cards': all_stats.get('yellow_cards', 0) or 0,
                'red_cards': all_stats.get('red_cards', 0) or 0,
                'clean_sheets': all_stats.get('clean_sheets', 0) or 0,
                'season': None  # Указываем что это агрегированная статистика
            }
            return Response(aggregated_stats)
        
        # Если статистики нет, возвращаем пустую статистику
        empty_stats = {
            'matches_played': 0,
            'matches_started': 0,
            'minutes_played': 0,
            'goals': 0,
            'assists': 0,
            'yellow_cards': 0,
            'red_cards': 0,
            'clean_sheets': 0
        }
        return Response(empty_stats)
    
    @action(detail=True, methods=['get'])
    def matches(self, request, pk=None):
        """Получить историю матчей игрока."""
        player = self.get_object()
        from matches.models import Match, Goal, Card, Assist
        from django.db.models import Q
        
        # Получаем сезон из query параметров
        season_id = request.query_params.get('season')
        
        # Находим все матчи, где игрок участвовал (голы, карточки, ассисты)
        matches_qs = Match.objects.filter(
            Q(goals__scorer=player) | 
            Q(cards__player=player) | 
            Q(assists__player=player) |
            Q(home_team=player.club) | 
            Q(away_team=player.club)
        ).distinct()
        
        # Фильтруем по сезону, если указан
        if season_id:
            matches_qs = matches_qs.filter(season_id=season_id)
        
        # Сортируем по дате (новые сначала)
        matches_qs = matches_qs.order_by('-date', '-time')
        
        # Формируем данные о матчах с информацией о вкладе игрока
        matches_data = []
        for match in matches_qs:
            goals = Goal.objects.filter(match=match, scorer=player).count()
            assists = Assist.objects.filter(match=match, player=player).count()
            yellow_cards = Card.objects.filter(match=match, player=player, card_type='yellow').count()
            red_cards = Card.objects.filter(match=match, player=player, card_type='red').count()
            
            # Определяем, за какую команду играл игрок
            is_home = match.home_team == player.club if player.club else False
            opponent = match.away_team if is_home else match.home_team
            team_score = match.home_score if is_home else match.away_score
            opponent_score = match.away_score if is_home else match.home_score
            
            # Определяем результат матча
            result = None
            if team_score is not None and opponent_score is not None:
                if team_score > opponent_score:
                    result = 'win'
                elif team_score == opponent_score:
                    result = 'draw'
                else:
                    result = 'loss'
            
            matches_data.append({
                'id': match.id,
                'date': match.date,
                'time': match.time,
                'season': {
                    'id': match.season.id if match.season else None,
                    'name': match.season.name if match.season else None
                },
                'home_team': {
                    'id': match.home_team.id if match.home_team else None,
                    'name': match.home_team.name if match.home_team else None
                },
                'away_team': {
                    'id': match.away_team.id if match.away_team else None,
                    'name': match.away_team.name if match.away_team else None
                },
                'opponent': {
                    'id': opponent.id if opponent else None,
                    'name': opponent.name if opponent else None
                },
                'is_home': is_home,
                'home_score': match.home_score,
                'away_score': match.away_score,
                'status': match.status,
                'player_goals': goals,
                'player_assists': assists,
                'player_yellow_cards': yellow_cards,
                'player_red_cards': red_cards,
                'result': result
            })
        
        return Response(matches_data)
    
    @action(detail=True, methods=['get'])
    def stats_by_season(self, request, pk=None):
        """Получить статистику игрока по всем сезонам."""
        player = self.get_object()
        stats = PlayerStats.objects.filter(player=player).select_related('season', 'club').order_by('-season__start_date')
        serializer = PlayerStatsSerializer(stats, many=True)
        return Response(serializer.data)


class PlayerStatsViewSet(viewsets.ModelViewSet):
    """ViewSet для управления статистикой игроков."""
    
    queryset = PlayerStats.objects.all()
    serializer_class = PlayerStatsSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        return super().get_permissions()

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    @action(detail=False, methods=['get'])
    def by_player(self, request):
        """Получить статистику по игроку."""
        player_id = request.query_params.get('player_id')
        if player_id:
            stats = self.queryset.filter(player_id=player_id)
        else:
            stats = self.queryset
        serializer = self.get_serializer(stats, many=True)
        return Response(serializer.data)


class PlayerTransferViewSet(viewsets.ModelViewSet):
    """ViewSet для управления трансферами игроков."""

    queryset = PlayerTransfer.objects.select_related('player', 'from_club', 'to_club')
    serializer_class = PlayerTransferSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        qs = super().get_queryset()
        player_id = self.request.query_params.get('player')
        if player_id:
            qs = qs.filter(player_id=player_id)
        return qs

    def perform_create(self, serializer):
        transfer = serializer.save()
        transfer.apply_if_confirmed()

    def perform_update(self, serializer):
        transfer = serializer.save()
        transfer.apply_if_confirmed()
    
    @action(detail=False, methods=['get'])
    def by_season(self, request):
        """Получить статистику по сезону."""
        season_id = request.query_params.get('season_id')
        if season_id:
            stats = self.queryset.filter(season_id=season_id)
        else:
            stats = self.queryset
        serializer = self.get_serializer(stats, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Подтвердить трансфер."""
        transfer = self.get_object()
        if transfer.status != PlayerTransfer.TransferStatus.PENDING:
            return Response(
                {'error': 'Можно подтвердить только трансферы со статусом "Ожидание"'},
                status=400
            )
        
        transfer.status = PlayerTransfer.TransferStatus.CONFIRMED
        transfer.save()
        transfer.apply_if_confirmed()
        
        serializer = self.get_serializer(transfer)
        return Response({
            'message': 'Трансфер подтвержден',
            'transfer': serializer.data
        })
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Отменить трансфер."""
        transfer = self.get_object()
        if transfer.status != PlayerTransfer.TransferStatus.PENDING:
            return Response(
                {'error': 'Можно отменить только трансферы со статусом "Ожидание"'},
                status=400
            )
        
        transfer.status = PlayerTransfer.TransferStatus.CANCELLED
        transfer.save()
        
        serializer = self.get_serializer(transfer)
        return Response({
            'message': 'Трансфер отменен',
            'transfer': serializer.data
        }) 