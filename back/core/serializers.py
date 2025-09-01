from rest_framework import serializers
from django.contrib.auth.models import AbstractUser
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from .models import User, Season, Partner, Media, Referee, Management


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для модели User."""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'phone', 'avatar', 'bio', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


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
    
    class Meta:
        model = Season
        fields = '__all__'


class PartnerSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Partner."""
    
    class Meta:
        model = Partner
        fields = '__all__'
    
    def validate(self, attrs):
        """Валидация данных партнера."""
        # Убираем валидацию обязательных полей
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
    
    image_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Media
        fields = '__all__'
    
    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class RefereeSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Referee."""
    
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Referee
        fields = '__all__'
    
    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None


class ManagementSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Management."""
    
    class Meta:
        model = Management
        fields = '__all__'