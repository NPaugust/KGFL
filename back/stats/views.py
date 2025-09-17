from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import SeasonStats, ClubStats
from .serializers import SeasonStatsSerializer, ClubStatsSerializer


class SeasonStatsViewSet(viewsets.ModelViewSet):
    """ViewSet для управления статистикой сезонов."""
    
    queryset = SeasonStats.objects.all()
    serializer_class = SeasonStatsSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        # Временно разрешаем все операции для тестирования
        return [permissions.AllowAny()]
    
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


class ClubStatsViewSet(viewsets.ModelViewSet):
    """ViewSet для управления статистикой клубов."""
    
    queryset = ClubStats.objects.all()
    serializer_class = ClubStatsSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        # Временно разрешаем все операции для тестирования
        return [permissions.AllowAny()]
    
    @action(detail=False, methods=['get'])
    def by_club(self, request):
        """Получить статистику по клубу."""
        club_id = request.query_params.get('club_id')
        if club_id:
            stats = self.queryset.filter(club_id=club_id)
        else:
            stats = self.queryset
        serializer = self.get_serializer(stats, many=True)
        return Response(serializer.data)
    
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