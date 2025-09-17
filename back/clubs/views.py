from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .models import Club, Coach, ClubSeason, ClubApplication
from .serializers import (
    ClubSerializer, ClubListSerializer, ClubDetailSerializer,
    CoachSerializer, ClubSeasonSerializer, TableRowSerializer,
    ClubApplicationSerializer, ClubApplicationListSerializer, ClubApplicationDetailSerializer
)
import rest_framework.parsers


class ClubViewSet(viewsets.ModelViewSet):
    """ViewSet для управления клубами."""
    
    queryset = Club.objects.select_related().prefetch_related('seasons', 'players', 'coaches')
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
        # Параметр ?all=1 возвращает все записи без фильтра is_active
        if self.request.GET.get('all'):
            return qs
        # Для публичных таблиц/поиска оставляем только активные
        if self.action in ['table', 'search', 'list']:
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
        query = request.GET.get('q', '')
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
        
        # Получаем активный сезон или сезон из параметров
        season_id = request.GET.get('season')
        if season_id:
            try:
                season = Season.objects.get(id=season_id)
            except Season.DoesNotExist:
                return Response({'error': 'Сезон не найден'}, status=status.HTTP_404_NOT_FOUND)
        else:
            try:
                season = Season.objects.get(is_active=True)
            except Season.DoesNotExist:
                return Response({'error': 'Активный сезон не найден'}, status=status.HTTP_404_NOT_FOUND)
        
        # Временно отключаем кэш для отладки
        # cache_key = f'table_{season.id}'
        # cached_data = cache.get(cache_key)
        # if cached_data:
        #     return Response(cached_data)
        
        # Получаем все клубы и создаем ClubSeason записи если их нет
        all_clubs = Club.objects.filter(status='active')
        
        # Создаем ClubSeason записи для клубов, у которых их нет
        for club in all_clubs:
            club_season, created = ClubSeason.objects.get_or_create(
                club=club,
                season=season,
                defaults={
                    'position': 0,
                    'points': 0,
                    'matches_played': 0,
                    'wins': 0,
                    'draws': 0,
                    'losses': 0,
                    'goals_for': 0,
                    'goals_against': 0,
                    'goal_difference': 0
                }
            )
            if created:
                print(f"✅ Создана ClubSeason запись для {club.name}")
        
        # Получаем статистику клубов для сезона
        club_seasons = ClubSeason.objects.filter(season=season).order_by('-points', '-goal_difference', '-goals_for')
        
        # Обновляем позиции
        for i, club_season in enumerate(club_seasons, 1):
            club_season.position = i
            club_season.save()
        
        serializer = TableRowSerializer(club_seasons, many=True, context={'request': request})
        data = serializer.data
        
        # Временно отключаем кэш
        # cache.set(cache_key, data, 300)  # 5 минут
        
        return Response(data)
    
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
        club_id = request.GET.get('club_id')
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

    @action(detail=False, methods=['get'])
    def table(self, request):
        """Получить турнирную таблицу."""
        from core.models import Season
        
        season_id = request.GET.get('season_id')
        if season_id:
            try:
                season = Season.objects.get(id=season_id)
            except Season.DoesNotExist:
                return Response({'error': 'Сезон не найден'}, status=status.HTTP_404_NOT_FOUND)
        else:
            try:
                season = Season.objects.get(is_active=True)
            except Season.DoesNotExist:
                return Response({'error': 'Активный сезон не найден'}, status=status.HTTP_404_NOT_FOUND)
        
        club_seasons = ClubSeason.objects.filter(season=season).order_by('-points', '-goal_difference', '-goals_for')
        
        for i, club_season in enumerate(club_seasons, 1):
            club_season.position = i
            club_season.save()
        
        serializer = TableRowSerializer(club_seasons, many=True, context={'request': request})
        return Response(serializer.data)


class ClubApplicationViewSet(viewsets.ModelViewSet):
    """ViewSet для управления заявками клубов."""
    
    queryset = ClubApplication.objects.select_related('season', 'reviewed_by', 'club')
    serializer_class = ClubApplicationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ClubApplicationListSerializer
        elif self.action == 'retrieve':
            return ClubApplicationDetailSerializer
        return ClubApplicationSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        # Фильтр по статусу
        status_filter = self.request.GET.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        # Фильтр по сезону
        season_id = self.request.GET.get('season_id')
        if season_id:
            qs = qs.filter(season_id=season_id)
        return qs
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_parsers(self):
        return [rest_framework.parsers.MultiPartParser(), rest_framework.parsers.FormParser(), rest_framework.parsers.JSONParser()]
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Одобрить заявку клуба."""
        application = self.get_object()
        if application.status != ClubApplication.ApplicationStatus.PENDING:
            return Response(
                {'error': 'Можно одобрить только заявки со статусом "Ожидает рассмотрения"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            club = application.approve(request.user)
            serializer = self.get_serializer(application)
            return Response({
                'message': 'Заявка одобрена, клуб создан',
                'application': serializer.data,
                'club_id': club.id
            })
        except Exception as e:
            return Response(
                {'error': f'Ошибка при одобрении заявки: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Отклонить заявку клуба."""
        application = self.get_object()
        if application.status != ClubApplication.ApplicationStatus.PENDING:
            return Response(
                {'error': 'Можно отклонить только заявки со статусом "Ожидает рассмотрения"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', '')
        try:
            application.reject(request.user, reason)
            serializer = self.get_serializer(application)
            return Response({
                'message': 'Заявка отклонена',
                'application': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': f'Ошибка при отклонении заявки: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )