from rest_framework import serializers
from .models import Player, PlayerStats


class PlayerCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания игроков."""
    
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
    
    id = serializers.CharField(source='player.id', read_only=True)
    first_name = serializers.CharField(source='player.first_name', read_only=True)
    last_name = serializers.CharField(source='player.last_name', read_only=True)
    photo = serializers.CharField(source='player.photo', read_only=True)
    number = serializers.CharField(source='player.number', read_only=True)
    position = serializers.CharField(source='player.position', read_only=True)
    club = serializers.SerializerMethodField()
    goals_scored = serializers.CharField(source='goals', read_only=True)
    assists = serializers.CharField(read_only=True)
    yellow_cards = serializers.CharField(read_only=True)
    red_cards = serializers.CharField(read_only=True)
    games_played = serializers.CharField(source='matches_played', read_only=True)
    minutes_played = serializers.CharField(read_only=True)
    season = serializers.CharField(source='season.name', read_only=True)
    
    def get_club(self, obj):
        if obj.player.club:
            return {
                'id': obj.player.club.id,
                'name': obj.player.club.name,
                'logo': obj.player.club.logo.url if obj.player.club.logo else None
            }
        return None
    
    class Meta:
        model = PlayerStats
        fields = [
            'id', 'first_name', 'last_name', 'photo', 'number', 'position',
            'club', 'goals_scored', 'assists', 'yellow_cards', 'red_cards',
            'games_played', 'minutes_played', 'season'
        ] 