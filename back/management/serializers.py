from rest_framework import serializers
from .models import Manager


class ManagerSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Manager."""
    
    class Meta:
        model = Manager
        fields = '__all__'


class ManagerListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка руководителей."""
    
    class Meta:
        model = Manager
        fields = ['id', 'first_name', 'last_name', 'photo', 'position', 'is_active'] 