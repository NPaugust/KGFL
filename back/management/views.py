from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Manager
from .serializers import ManagerSerializer, ManagerListSerializer


class ManagerViewSet(viewsets.ModelViewSet):
    """ViewSet для управления руководителями."""
    
    queryset = Manager.objects.all()
    serializer_class = ManagerSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ManagerListSerializer
        return ManagerSerializer
    
    def get_permissions(self):
        # Временно разрешаем все операции для тестирования
        return [permissions.AllowAny()]
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Поиск руководителей."""
        query = request.GET.get('q', '')
        if query:
            managers = self.queryset.filter(
                Q(first_name__icontains=query) | 
                Q(last_name__icontains=query) | 
                Q(position__icontains=query)
            )
        else:
            managers = self.queryset
        serializer = self.get_serializer(managers, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_position(self, request):
        """Получить руководителей по должности."""
        position = request.GET.get('position')
        if position:
            managers = self.queryset.filter(position=position)
        else:
            managers = self.queryset
        serializer = self.get_serializer(managers, many=True)
        return Response(serializer.data) 