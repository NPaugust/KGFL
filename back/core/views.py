from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Q
from .models import User, Season, Partner, Media
from .serializers import (
    UserSerializer, UserCreateSerializer, LoginSerializer,
    SeasonSerializer, PartnerSerializer, MediaSerializer
)
import rest_framework.parsers


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
            if user:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'access_token': str(refresh.access_token),
                    'refresh_token': str(refresh),
                    'user': UserSerializer(user).data
                })
            else:
                return Response({'error': 'Неверные учетные данные'}, status=status.HTTP_400_BAD_REQUEST)
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
        return super().get_permissions()

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            obj = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'message': 'Ошибка валидации', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
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
        return super().get_permissions()
    
    def get_parsers(self):
        return [rest_framework.parsers.MultiPartParser(), rest_framework.parsers.FormParser(), rest_framework.parsers.JSONParser()]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            obj = serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response({'message': 'Ошибка валидации', 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)
    
    def create(self, request, *args, **kwargs):
        """Создание партнера с обработкой ошибок."""
        try:
            serializer = self.get_serializer(data=request.data)
            if serializer.is_valid():
                partner = serializer.save()
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'message': 'Ошибка валидации',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'message': 'Внутренняя ошибка при создании партнера', 'errors': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """Обновление партнера с обработкой ошибок."""
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=request.data, partial=partial)
            if serializer.is_valid():
                partner = serializer.save()
                return Response(serializer.data)
            else:
                return Response({
                    'message': 'Ошибка валидации',
                    'errors': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'message': 'Внутренняя ошибка при обновлении партнера', 'errors': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """Удаление партнера с обработкой ошибок."""
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
                {'error': f'Ошибка при удалении партнера: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
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
        return super().get_permissions()
    
    def get_parsers(self):
        return [rest_framework.parsers.MultiPartParser(), rest_framework.parsers.FormParser(), rest_framework.parsers.JSONParser()]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context

    def destroy(self, request, *args, **kwargs):
        """Удаление медиа с обработкой ошибок."""
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
                {'message': 'Внутренняя ошибка при удалении медиа', 'errors': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Получить медиа файлы по категории."""
        category = request.query_params.get('category', 'gallery')
        media = self.queryset.filter(category=category)
        return Response(MediaSerializer(media, many=True, context={'request': request}).data)


 