from rest_framework import serializers
from .models import Referee


class RefereeSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Referee."""
    
    class Meta:
        model = Referee
        fields = '__all__'


class RefereeListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка судей."""
    
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Referee
        fields = [
            'id', 'first_name', 'last_name', 'photo', 'photo_url', 'category', 
            'region', 'experience_months', 'phone', 'nationality', 'is_active'
        ]
    
    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None 