from rest_framework import serializers
from .models import Player, PlayerStats


class PlayerCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания игроков."""
    
    season = serializers.PrimaryKeyRelatedField(read_only=True)
    
    def create(self, validated_data):
        """Автоматически назначаем активный сезон."""
        from core.models import Season
        try:
            active_season = Season.objects.get(is_active=True)
            validated_data['season'] = active_season
        except Season.DoesNotExist:
            raise serializers.ValidationError("Активный сезон не найден")
        
        return super().create(validated_data)
    
    class Meta:
        model = Player
        fields = '__all__'


class PlayerSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Player."""
    
    club_name = serializers.CharField(source='club.name', read_only=True)
    season_name = serializers.CharField(source='season.name', read_only=True)
    
    class Meta:
        model = Player
        fields = '__all__'


class PlayerListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка игроков."""
    
    club_name = serializers.CharField(source='club.name', read_only=True)
    
    class Meta:
        model = Player
        fields = ['id', 'first_name', 'last_name', 'photo', 'position', 'number', 'club_name', 'is_active']


class PlayerDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детальной информации об игроке."""
    
    club_name = serializers.CharField(source='club.name', read_only=True)
    season_name = serializers.CharField(source='season.name', read_only=True)
    stats = serializers.SerializerMethodField()
    
    class Meta:
        model = Player
        fields = '__all__'
    
    def get_stats(self, obj):
        try:
            stats = obj.stats.get(season=obj.season)
            return PlayerStatsSerializer(stats).data
        except PlayerStats.DoesNotExist:
            return None


class PlayerStatsSerializer(serializers.ModelSerializer):
    """Сериализатор для модели PlayerStats."""
    
    player_name = serializers.CharField(source='player.full_name', read_only=True)
    season_name = serializers.CharField(source='season.name', read_only=True)
    
    class Meta:
        model = PlayerStats
        fields = '__all__'


class TopScorerSerializer(serializers.ModelSerializer):
    """Сериализатор для лучших бомбардиров."""
    
    player_name = serializers.CharField(source='player.full_name', read_only=True)
    club_name = serializers.CharField(source='player.club.name', read_only=True)
    club_logo = serializers.CharField(source='player.club.logo', read_only=True)
    
    class Meta:
        model = PlayerStats
        fields = ['id', 'player_name', 'club_name', 'club_logo', 'goals', 'assists', 'matches_played'] 