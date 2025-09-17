from rest_framework import serializers
from .models import SeasonStats, ClubStats


class SeasonStatsSerializer(serializers.ModelSerializer):
    """Сериализатор для модели SeasonStats."""
    
    season_name = serializers.CharField(source='season.name', read_only=True)
    
    class Meta:
        model = SeasonStats
        fields = '__all__'


class ClubStatsSerializer(serializers.ModelSerializer):
    """Сериализатор для модели ClubStats."""
    
    club_name = serializers.CharField(source='club.name', read_only=True)
    season_name = serializers.CharField(source='season.name', read_only=True)
    goal_difference = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = ClubStats
        fields = '__all__' 