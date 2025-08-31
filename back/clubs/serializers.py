from rest_framework import serializers
from .models import Club, Coach, ClubSeason


class ClubSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Club."""
    
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Club
        fields = '__all__'
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class ClubListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка клубов."""
    
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Club
        fields = ['id', 'name', 'short_name', 'logo', 'logo_url', 'city', 'founded', 'is_active']
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class CoachSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Coach."""
    
    club_name = serializers.CharField(source='club.name', read_only=True)
    season_name = serializers.CharField(source='season.name', read_only=True)
    
    class Meta:
        model = Coach
        fields = '__all__'


class ClubSeasonSerializer(serializers.ModelSerializer):
    """Сериализатор для модели ClubSeason."""
    
    club_name = serializers.CharField(source='club.name', read_only=True)
    club_logo = serializers.CharField(source='club.logo', read_only=True)
    season_name = serializers.CharField(source='season.name', read_only=True)
    
    class Meta:
        model = ClubSeason
        fields = '__all__'


class ClubDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детальной информации о клубе."""
    
    coaches = CoachSerializer(many=True, read_only=True)
    seasons = ClubSeasonSerializer(many=True, read_only=True)
    
    class Meta:
        model = Club
        fields = '__all__'


class TableRowSerializer(serializers.ModelSerializer):
    """Сериализатор для строки турнирной таблицы."""
    
    club_name = serializers.CharField(source='club.name', read_only=True)
    club_logo = serializers.CharField(source='club.logo', read_only=True)
    goals_formatted = serializers.CharField(read_only=True)
    goal_difference = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = ClubSeason
        fields = [
            'id', 'club_name', 'club_logo', 'position', 'points',
            'matches_played', 'wins', 'draws', 'losses',
            'goals_for', 'goals_against', 'goals_formatted', 'goal_difference'
        ] 