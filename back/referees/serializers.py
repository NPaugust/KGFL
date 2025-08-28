from rest_framework import serializers
from .models import Referee


class RefereeSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Referee."""
    
    class Meta:
        model = Referee
        fields = '__all__'


class RefereeListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка судей."""
    
    class Meta:
        model = Referee
        fields = ['id', 'first_name', 'last_name', 'photo', 'category', 'nationality', 'is_active'] 