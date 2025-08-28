from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import Media, User, Season, Partner, Referee, Management


class UserSerializer(serializers.ModelSerializer):
    """Сериализатор для модели User."""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'role', 'phone', 'avatar', 'bio', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания пользователя."""
    
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'password_confirm', 'role', 'phone'
        ]
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Пароли не совпадают")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user


class LoginSerializer(serializers.Serializer):
    """Сериализатор для входа в систему."""
    
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Неверные учетные данные')
            if not user.is_active:
                raise serializers.ValidationError('Пользователь неактивен')
            attrs['user'] = user
        else:
            raise serializers.ValidationError('Необходимо указать имя пользователя и пароль')
        
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


class MediaSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Media."""
    
    class Meta:
        model = Media
        fields = '__all__'


class RefereeSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Referee."""
    
    class Meta:
        model = Referee
        fields = '__all__'


class RefereeCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания судьи."""
    
    class Meta:
        model = Referee
        fields = '__all__'


class ManagementSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Management."""
    
    class Meta:
        model = Management
        fields = '__all__'


class ManagementCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания руководства."""
    
    class Meta:
        model = Management
        fields = '__all__'