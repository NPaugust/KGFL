from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Referee
from .serializers import RefereeSerializer, RefereeListSerializer


class RefereeViewSet(viewsets.ModelViewSet):
    """ViewSet для управления судьями."""
    
    queryset = Referee.objects.filter(is_active=True)
    serializer_class = RefereeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return RefereeListSerializer
        return RefereeSerializer
    
    def get_permissions(self):
        # Временно разрешаем все операции для тестирования
        return [permissions.AllowAny()]
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Поиск судей."""
        query = request.query_params.get('q', '')
        if query:
            referees = self.queryset.filter(
                Q(first_name__icontains=query) | 
                Q(last_name__icontains=query) | 
                Q(nationality__icontains=query)
            )
        else:
            referees = self.queryset
        serializer = self.get_serializer(referees, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Получить судей по категории."""
        category = request.query_params.get('category')
        if category:
            referees = self.queryset.filter(category=category)
        else:
            referees = self.queryset
        serializer = self.get_serializer(referees, many=True)
        return Response(serializer.data) 