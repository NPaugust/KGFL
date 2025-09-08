from rest_framework import serializers
from .models import Manager


class ManagerSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Manager."""
    
    class Meta:
        model = Manager
        fields = '__all__'


class ManagerListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка руководителей."""
    
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Manager
        fields = [
            'id', 'first_name', 'last_name', 'photo', 'photo_url', 'position', 
            'bio', 'email', 'phone', 'order', 'is_active'
        ]
    
    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None 