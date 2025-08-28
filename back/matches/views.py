from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from datetime import datetime, timedelta
from .models import Match, Goal, Card, Substitution
from .serializers import (
    MatchSerializer, MatchListSerializer, MatchDetailSerializer,
    GoalSerializer, CardSerializer, SubstitutionSerializer
)


class MatchViewSet(viewsets.ModelViewSet):
    """ViewSet для управления матчами."""
    
    queryset = Match.objects.all()
    serializer_class = MatchSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return MatchListSerializer
        elif self.action == 'retrieve':
            return MatchDetailSerializer
        return MatchSerializer
    
    def get_permissions(self):
        # Временно разрешаем все операции для тестирования
        return [permissions.AllowAny()]
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Получить предстоящие матчи."""
        today = datetime.now().date()
        upcoming_matches = self.queryset.filter(
            date__gte=today,
            status='scheduled'
        ).order_by('date', 'time')
        serializer = self.get_serializer(upcoming_matches, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Получить последние матчи."""
        today = datetime.now().date()
        latest_matches = self.queryset.filter(
            date__lt=today,
            status='finished'
        ).order_by('-date', '-time')[:10]
        serializer = self.get_serializer(latest_matches, many=True)
        return Response(serializer.data)
    
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