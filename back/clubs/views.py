from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Club, Coach, ClubSeason
from .serializers import (
    ClubSerializer, ClubListSerializer, ClubDetailSerializer,
    CoachSerializer, ClubSeasonSerializer, TableRowSerializer
)


class ClubViewSet(viewsets.ModelViewSet):
    """ViewSet для управления клубами."""
    
    queryset = Club.objects.filter(is_active=True)
    serializer_class = ClubSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ClubListSerializer
        elif self.action == 'retrieve':
            return ClubDetailSerializer
        return ClubSerializer
    
    def get_permissions(self):
        # Временно разрешаем все операции для тестирования
        return [permissions.AllowAny()]
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Поиск клубов."""
        query = request.query_params.get('q', '')
        if query:
            clubs = self.queryset.filter(
                Q(name__icontains=query) | 
                Q(city__icontains=query) | 
                Q(short_name__icontains=query)
            )
        else:
            clubs = self.queryset
        serializer = self.get_serializer(clubs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def table(self, request):
        """Получить турнирную таблицу."""
        from core.models import Season
        try:
            active_season = Season.objects.get(is_active=True)
            from .models import ClubSeason
            table_rows = ClubSeason.objects.filter(season=active_season).order_by('position', '-points', '-goals_for', 'goals_against')
            serializer = TableRowSerializer(table_rows, many=True)
            return Response(serializer.data)
        except Season.DoesNotExist:
            return Response({'error': 'Активный сезон не найден'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['get'])
    def players(self, request, pk=None):
        """Получить игроков клуба."""
        club = self.get_object()
        players = club.players.all()
        from players.serializers import PlayerListSerializer
        serializer = PlayerListSerializer(players, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def matches(self, request, pk=None):
        """Получить матчи клуба."""
        club = self.get_object()
        from matches.models import Match
        matches = Match.objects.filter(
            Q(home_team=club) | Q(away_team=club)
        ).order_by('-date', '-time')
        from matches.serializers import MatchListSerializer
        serializer = MatchListSerializer(matches, many=True)
        return Response(serializer.data)


class CoachViewSet(viewsets.ModelViewSet):
    """ViewSet для управления тренерами."""
    
    queryset = Coach.objects.filter(is_active=True)
    serializer_class = CoachSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        # Временно разрешаем все операции для тестирования
        return [permissions.AllowAny()]
    
    @action(detail=False, methods=['get'])
    def by_club(self, request):
        """Получить тренеров по клубу."""
        club_id = request.query_params.get('club_id')
        if club_id:
            coaches = self.queryset.filter(club_id=club_id)
        else:
            coaches = self.queryset
        serializer = self.get_serializer(coaches, many=True)
        return Response(serializer.data)


class ClubSeasonViewSet(viewsets.ModelViewSet):
    """ViewSet для управления сезонами клубов."""
    
    queryset = ClubSeason.objects.all()
    serializer_class = ClubSeasonSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        # Временно разрешаем все операции для тестирования
        return [permissions.AllowAny()] 