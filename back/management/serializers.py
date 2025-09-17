from rest_framework import serializers
from .models import Manager


class ManagerSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Manager."""
    
    photo_url = serializers.SerializerMethodField()
    full_name = serializers.CharField(read_only=True)

    class Meta:
        model = Manager
        fields = [
            'id', 'full_name', 'first_name', 'last_name', 'photo', 'photo_url', 'position',
            'email', 'phone', 'order', 'is_active', 'notes'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
        }

    def get_photo_url(self, obj):
        if obj.photo and hasattr(obj.photo, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None


class ManagerListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка руководителей."""
    
    photo_url = serializers.SerializerMethodField()
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Manager
        fields = [
            'id', 'full_name', 'first_name', 'last_name', 'photo_url', 'position', 'email', 'phone', 'notes', 'is_active'
        ]
    
    def get_photo_url(self, obj):
        if obj.photo and hasattr(obj.photo, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None 