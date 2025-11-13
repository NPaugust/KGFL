from rest_framework import serializers
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, Season, Group, Partner, Media


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для модели User."""
    
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'avatar', 'avatar_url', 'bio', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            url = obj.avatar.url
            return request.build_absolute_uri(url) if request else url
        return None


class UserCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания пользователя."""
    
    password = serializers.CharField(write_only=True, required=False)
    password_confirm = serializers.CharField(write_only=True, required=False)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'password_confirm', 'phone'
        ]
    
    def create(self, validated_data):
        if 'password_confirm' in validated_data:
            validated_data.pop('password_confirm')
        password = validated_data.pop('password', 'defaultpassword123')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Сериализатор для входа в систему."""
    
    username = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True, required=False)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                attrs['user'] = None
            elif not user.is_active:
                attrs['user'] = None
            else:
                attrs['user'] = user
        else:
            attrs['user'] = None
        
        return attrs


class SeasonSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Season."""
    
    has_groups = serializers.BooleanField(read_only=True)
    groups = serializers.SerializerMethodField()
    
    class Meta:
        model = Season
        fields = '__all__'
    
    def get_groups(self, obj):
        """Получаем список групп сезона."""
        if obj.has_groups:
            groups = obj.groups.all()
            return GroupSerializer(groups, many=True, context=self.context).data
        return []


class GroupSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Group."""
    
    clubs_count = serializers.IntegerField(read_only=True)
    season_name = serializers.CharField(source='season.name', read_only=True)
    
    class Meta:
        model = Group
        fields = '__all__'


class PartnerSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Partner."""
    
    class Meta:
        model = Partner
        fields = '__all__'
    
    def validate(self, attrs):
        """Базовая валидация данных партнёра."""
        name = attrs.get('name') or getattr(self.instance, 'name', None)
        logo = attrs.get('logo') or getattr(self.instance, 'logo', None)
        if not name:
            raise serializers.ValidationError({'name': 'Название обязательно'})
        if not logo:
            # Разрешаем пустой логотип при обновлении, если уже есть
            if not self.instance:
                raise serializers.ValidationError({'logo': 'Логотип обязателен'})
        return attrs
    
    def create(self, validated_data):
        """Создание партнера с обработкой ошибок."""
        try:
            return super().create(validated_data)
        except Exception as e:
            raise serializers.ValidationError(f"Ошибка при создании партнера: {str(e)}")
    
    def update(self, instance, validated_data):
        """Обновление партнера с обработкой ошибок."""
        try:
            return super().update(instance, validated_data)
        except Exception as e:
            raise serializers.ValidationError(f"Ошибка при обновлении партнера: {str(e)}")


class MediaSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Media."""
    
    file_url = serializers.SerializerMethodField()
    preview_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Media
        fields = '__all__'
    
    def get_file_url(self, obj):
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
    
    def get_preview_url(self, obj):
        if obj.preview:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.preview.url)
            return obj.preview.url
        return None

