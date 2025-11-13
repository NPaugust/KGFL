from rest_framework import viewsets, permissions, status
import rest_framework.parsers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from datetime import datetime, timedelta
from .models import Match, Goal, Card, Substitution, Stadium, Assist
from .serializers import (
    MatchSerializer, MatchListSerializer, MatchDetailSerializer, MatchCreateSerializer,
    GoalSerializer, CardSerializer, SubstitutionSerializer, StadiumSerializer, AssistSerializer
)


class MatchViewSet(viewsets.ModelViewSet):
    """ViewSet для управления матчами."""
    
    queryset = Match.objects.select_related('home_team', 'away_team', 'season', 'stadium_ref').prefetch_related('goals', 'cards', 'substitutions')
    serializer_class = MatchSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MatchListSerializer
        elif self.action == 'retrieve':
            return MatchDetailSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return MatchCreateSerializer
        return MatchSerializer
    
    def get_permissions(self):
        return super().get_permissions()

    def get_parsers(self):
        return [
            rest_framework.parsers.MultiPartParser(),
            rest_framework.parsers.FormParser(),
            rest_framework.parsers.JSONParser(),
        ]

    def get_queryset(self):
        """Фильтрация матчей по сезону."""
        qs = super().get_queryset()
        
        # Фильтрация по сезону
        season_id = self.request.query_params.get('season')
        
        # Проверяем, что season_id не пустой и не None
        if season_id and season_id.strip():
            qs = qs.filter(season_id=season_id.strip())
        # Если season_id пустой или None - не фильтруем, показываем все матчи
        
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Получить последние завершенные матчи."""
        from django.utils import timezone
        from datetime import date
        
        today = date.today()
        
        latest_matches = self.queryset.filter(
            Q(status='finished') | 
            Q(date__lt=today, status__in=['scheduled', 'live'])
        ).order_by('-date', '-time')[:5]
        
        serializer = MatchListSerializer(latest_matches, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Получить ближайшие матчи."""
        from django.utils import timezone
        from datetime import date
        
        today = date.today()
        
        # Получаем ближайшие 5 матчей (scheduled, live или будущие по дате)
        upcoming_matches = self.queryset.filter(
            Q(status__in=['scheduled', 'live']) |
            Q(date__gte=today, status='scheduled')
        ).order_by('date', 'time')[:5]
        
        serializer = MatchListSerializer(upcoming_matches, many=True, context={'request': request})
        return Response(serializer.data)

    def destroy(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            instance.delete()
            return Response(status=204)
        except Exception as e:
            from django.db.models.deletion import ProtectedError
            if isinstance(e, ProtectedError):
                return Response(
                    {'error': 'Невозможно удалить матч: есть связанные события (голы/карточки/замены).'},
                    status=400
                )
            return Response({'error': f'Ошибка при удалении матча: {str(e)}'}, status=500)
    
    
    @action(detail=False, methods=['get'])
    def live(self, request):
        """Получить матчи в прямом эфире."""
        live_matches = self.queryset.filter(status='live')
        serializer = self.get_serializer(live_matches, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_club(self, request):
        """Получить матчи по клубу."""
        club_id = request.query_params.get('club_id')
        if club_id:
            matches = self.queryset.filter(
                Q(home_team_id=club_id) | Q(away_team_id=club_id)
            ).order_by('-date', '-time')
        else:
            matches = self.queryset
        serializer = self.get_serializer(matches, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_date(self, request):
        """Получить матчи по дате."""
        date_str = request.query_params.get('date')
        if date_str:
            try:
                date = datetime.strptime(date_str, '%Y-%m-%d').date()
                matches = self.queryset.filter(date=date)
            except ValueError:
                return Response({'error': 'Неверный формат даты'}, status=status.HTTP_400_BAD_REQUEST)
        else:
            matches = self.queryset
        serializer = self.get_serializer(matches, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """Получить матчи по статусу."""
        status_filter = request.query_params.get('status')
        if status_filter:
            matches = self.queryset.filter(status=status_filter)
        else:
            matches = self.queryset
        serializer = self.get_serializer(matches, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def goals(self, request, pk=None):
        """Получить голы матча."""
        match = self.get_object()
        goals = Goal.objects.filter(match=match)
        serializer = GoalSerializer(goals, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def assists(self, request, pk=None):
        """Получить ассисты матча."""
        match = self.get_object()
        assists = Assist.objects.filter(match=match)
        serializer = AssistSerializer(assists, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def cards(self, request, pk=None):
        """Получить карточки матча."""
        match = self.get_object()
        cards = Card.objects.filter(match=match)
        serializer = CardSerializer(cards, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def substitutions(self, request, pk=None):
        """Получить замены матча."""
        match = self.get_object()
        substitutions = Substitution.objects.filter(match=match)
        serializer = SubstitutionSerializer(substitutions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_goal(self, request, pk=None):
        """Добавить гол в матч."""
        match = self.get_object()
        data = request.data.copy()
        data['match'] = match.id
        
        serializer = GoalSerializer(data=data)
        if serializer.is_valid():
            goal = serializer.save()
            # Обновляем счет матча
            if goal.team == match.home_team:
                match.home_score = (match.home_score or 0) + 1
            else:
                match.away_score = (match.away_score or 0) + 1
            match.save()
            
            return Response({
                'message': 'Гол добавлен',
                'goal': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_assist(self, request, pk=None):
        """Добавить ассист в матч."""
        match = self.get_object()
        data = request.data.copy()
        data['match'] = match.id

        try:
            from players.models import Player
            from .models import Assist
            player = Player.objects.get(id=data['player'])
            minute = data.get('minute', 1)

            # Создаем отдельное событие ассиста
            team = match.home_team if data.get('team') == match.home_team.id else match.away_team
            assist = Assist.objects.create(
                match=match,
                player=player,
                team=team,
                minute=minute
            )

            return Response({
                'message': 'Ассист добавлен',
                'assist': {'id': assist.id, 'player': player.full_name, 'minute': minute}
            }, status=status.HTTP_201_CREATED)

        except Player.DoesNotExist:
            return Response({
                'error': 'Игрок не найден'
            }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def add_card(self, request, pk=None):
        """Добавить карточку в матч."""
        match = self.get_object()
        data = request.data.copy()
        data['match'] = match.id
        
        serializer = CardSerializer(data=data)
        if serializer.is_valid():
            card = serializer.save()
            return Response({
                'message': 'Карточка добавлена',
                'card': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def add_substitution(self, request, pk=None):
        """Добавить замену в матч."""
        match = self.get_object()
        data = request.data.copy()
        data['match'] = match.id
        
        serializer = SubstitutionSerializer(data=data)
        if serializer.is_valid():
            substitution = serializer.save()
            return Response({
                'message': 'Замена добавлена',
                'substitution': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GoalViewSet(viewsets.ModelViewSet):
    """ViewSet для управления голами."""
    
    queryset = Goal.objects.all()
    serializer_class = GoalSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        # Временно разрешаем все операции для тестирования
        return [permissions.AllowAny()]


class CardViewSet(viewsets.ModelViewSet):
    """ViewSet для управления карточками."""
    
    queryset = Card.objects.all()
    serializer_class = CardSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        # Временно разрешаем все операции для тестирования
        return [permissions.AllowAny()]


class SubstitutionViewSet(viewsets.ModelViewSet):
    """ViewSet для управления заменами."""
    
    queryset = Substitution.objects.all()
    serializer_class = SubstitutionSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        # Временно разрешаем все операции для тестирования
        return [permissions.AllowAny()] 


class StadiumViewSet(viewsets.ModelViewSet):
    queryset = Stadium.objects.all()
    serializer_class = StadiumSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]


class AssistViewSet(viewsets.ModelViewSet):
    """ViewSet для управления ассистами."""
    
    queryset = Assist.objects.select_related('match', 'player', 'team')
    serializer_class = AssistSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        match_id = self.request.query_params.get('match_id')
        if match_id:
            queryset = queryset.filter(match_id=match_id)
        return queryset

