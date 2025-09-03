from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Club, Coach, ClubSeason
from .serializers import (
    ClubSerializer, ClubListSerializer, ClubDetailSerializer,
    CoachSerializer, ClubSeasonSerializer, TableRowSerializer
)
import rest_framework.parsers


class ClubViewSet(viewsets.ModelViewSet):
    """ViewSet для управления клубами."""
    
    queryset = Club.objects.all()
    serializer_class = ClubSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ClubListSerializer
        elif self.action == 'retrieve':
            return ClubDetailSerializer
        return ClubSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        # Для списков показываем только активные
        if self.action in ['list', 'table', 'search']:
            return qs.filter(is_active=True)
        return qs
    
    def get_permissions(self):
        return super().get_permissions()
    
    def get_parsers(self):
        return [rest_framework.parsers.MultiPartParser(), rest_framework.parsers.FormParser(), rest_framework.parsers.JSONParser()]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Создание клуба с обработкой ошибок."""
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                club = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Ошибка при создании клуба: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """Обновление клуба с обработкой ошибок."""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                club = serializer.save()
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Ошибка при обновлении клуба: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """Удаление клуба с обработкой ошибок."""
        try:
            instance = self.get_object()
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            from django.db.models.deletion import ProtectedError
            if isinstance(e, ProtectedError):
                return Response(
                    {'error': 'Невозможно удалить: есть связанные объекты. Удалите связанные записи или измените связи.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {'error': f'Ошибка при удалении клуба: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
            # Получаем сезон из параметров запроса или используем активный
            season_id = request.query_params.get('season')
            if season_id:
                # Если передан season_id, используем его
                season = Season.objects.get(id=season_id)
            else:
                # Иначе используем активный сезон
                season = Season.objects.get(is_active=True)
            
            from .models import ClubSeason
            table_rows = ClubSeason.objects.filter(season=season).order_by('position', '-points', '-goals_for', 'goals_against')
            serializer = TableRowSerializer(table_rows, many=True)
            return Response(serializer.data)
        except Season.DoesNotExist:
            return Response({'error': 'Сезон не найден'}, status=status.HTTP_404_NOT_FOUND)
    
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
    
    queryset = Coach.objects.all()
    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in ['list', 'by_club']:
            return qs.filter(is_active=True)
        return qs
    serializer_class = CoachSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        return super().get_permissions()
    
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
        return super().get_permissions()