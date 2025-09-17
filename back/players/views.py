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
        try:
            active_season = Season.objects.get(is_active=True)
            season_filter = {'season': active_season}
        except Season.DoesNotExist:
            # Если активного сезона нет, не фильтруем по сезону
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
        
        # Получаем активный сезон или последний сезон
        try:
            active_season = Season.objects.get(is_active=True)
        except Season.DoesNotExist:
            active_season = Season.objects.order_by('-id').first()
        
        if active_season:
            stats = PlayerStats.objects.filter(player=player, season=active_season).first()
            if stats:
                serializer = PlayerStatsSerializer(stats)
                return Response(serializer.data)
        
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