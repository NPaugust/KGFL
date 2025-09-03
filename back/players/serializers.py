from rest_framework import serializers
from .models import Player, PlayerStats, PlayerTransfer


class PlayerCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания игроков."""
    
    class Meta:
        model = Player
        fields = '__all__'


class PlayerSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Player."""
    
    club_name = serializers.CharField(source='club.name', read_only=True)
    season_name = serializers.CharField(source='season.name', read_only=True)
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Player
        fields = '__all__'

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            url = obj.photo.url
            return request.build_absolute_uri(url) if request else url
        return None


class PlayerListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка игроков."""
    
    club_name = serializers.CharField(source='club.name', read_only=True)
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Player
        fields = ['id', 'first_name', 'last_name', 'photo', 'photo_url', 'position', 'number', 'club_name', 'is_active']

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            url = obj.photo.url
            return request.build_absolute_uri(url) if request else url
        return None


class PlayerDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детальной информации об игроке."""
    
    club_name = serializers.CharField(source='club.name', read_only=True)
    season_name = serializers.CharField(source='season.name', read_only=True)
    stats = serializers.SerializerMethodField()
    photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Player
        fields = '__all__'
    
    def get_stats(self, obj):
        try:
            stats = obj.stats.get(season=obj.season)
            return PlayerStatsSerializer(stats).data
        except PlayerStats.DoesNotExist:
            return None

    def get_photo_url(self, obj):
        if obj.photo:
            request = self.context.get('request')
            url = obj.photo.url
            return request.build_absolute_uri(url) if request else url
        return None


class PlayerStatsSerializer(serializers.ModelSerializer):
    """Сериализатор для модели PlayerStats."""
    
    player_name = serializers.CharField(source='player.full_name', read_only=True)
    season_name = serializers.CharField(source='season.name', read_only=True)
    
    class Meta:
        model = PlayerStats
        fields = '__all__'


class PlayerTransferSerializer(serializers.ModelSerializer):
    """Сериализатор для модели PlayerTransfer."""

    player_name = serializers.CharField(source='player.full_name', read_only=True)
    from_club_name = serializers.CharField(source='from_club.name', read_only=True)
    to_club_name = serializers.CharField(source='to_club.name', read_only=True)

    class Meta:
        model = PlayerTransfer
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
        club = getattr(obj.player, 'club', None)
        if not club:
            return None
        logo_url = None
        if getattr(club, 'logo', None):
            request = self.context.get('request')
            raw = club.logo.url
            logo_url = request.build_absolute_uri(raw) if request else raw
        return {
            'id': club.id,
            'name': club.name,
            'logo': logo_url,
        }
    
    class Meta:
        model = PlayerStats
        fields = [
            'id', 'first_name', 'last_name', 'photo', 'number', 'position',
            'club', 'goals_scored', 'assists', 'yellow_cards', 'red_cards',
            'games_played', 'minutes_played', 'season'
        ] 