from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import User, Season, Partner, Media, Referee, Management
from .serializers import (
    UserSerializer, UserCreateSerializer, LoginSerializer,
    SeasonSerializer, PartnerSerializer, MediaSerializer,
    RefereeSerializer, RefereeCreateSerializer, ManagementSerializer, ManagementCreateSerializer
)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet для управления пользователями."""
    
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'login']:
            return [permissions.AllowAny()]
        return super().get_permissions()
    
    @action(detail=False, methods=['post'])
    def login(self, request):
        """Вход в систему."""
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'access_token': str(refresh.access_token),
                'refresh_token': str(refresh),
                'user': UserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def profile(self, request):
        """Получить профиль текущего пользователя."""
        return Response(UserSerializer(request.user).data)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Получить профиль текущего пользователя (альтернативный endpoint)."""
        return Response(UserSerializer(request.user).data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """Обновить профиль текущего пользователя."""
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SeasonViewSet(viewsets.ModelViewSet):
    """ViewSet для управления сезонами."""
    
    queryset = Season.objects.all()
    serializer_class = SeasonSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        # Временно разрешаем все операции для тестирования
        return [permissions.AllowAny()]
    
    @action(detail=False, methods=['get'])
    def active(self, request):
        """Получить активный сезон."""
        try:
            active_season = Season.objects.get(is_active=True)
            return Response(SeasonSerializer(active_season).data)
        except Season.DoesNotExist:
            return Response({'error': 'Активный сезон не найден'}, status=status.HTTP_404_NOT_FOUND)


class PartnerViewSet(viewsets.ModelViewSet):
    """ViewSet для управления партнерами."""
    
    queryset = Partner.objects.filter(is_active=True)
    serializer_class = PartnerSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        # Временно разрешаем все операции для тестирования
        return [permissions.AllowAny()]
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Получить партнеров по категории."""
        category = request.query_params.get('category')
        if category:
            partners = self.queryset.filter(category=category)
        else:
            partners = self.queryset
        return Response(PartnerSerializer(partners, many=True).data)


class MediaViewSet(viewsets.ModelViewSet):
    """ViewSet для управления медиа файлами."""
    
    queryset = Media.objects.filter(is_active=True)
    serializer_class = MediaSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        # Временно разрешаем все операции для тестирования
        return [permissions.AllowAny()]
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Получить медиа файлы по категории."""
        category = request.query_params.get('category', 'gallery')
        media = self.queryset.filter(category=category)
        return Response(MediaSerializer(media, many=True).data)


class RefereeViewSet(viewsets.ModelViewSet):
    """ViewSet для управления судьями."""
    
    queryset = Referee.objects.filter(is_active=True)
    serializer_class = RefereeSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return RefereeCreateSerializer
        return RefereeSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]


class ManagementViewSet(viewsets.ModelViewSet):
    """ViewSet для управления руководством."""
    
    queryset = Management.objects.filter(is_active=True)
    serializer_class = ManagementSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return ManagementCreateSerializer
        return ManagementSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
 