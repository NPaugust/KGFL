from rest_framework import serializers
from .models import Club, Coach, ClubSeason, ClubApplication


class ClubSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Club."""
    
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Club
        fields = '__all__'
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            try:
                return request.build_absolute_uri(obj.logo.url) if request else obj.logo.url
            except:
                return obj.logo.url
        return None


class ClubListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка клубов."""
    
    logo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = Club
        fields = [
            'id', 'name', 'short_name', 'logo', 'logo_url', 'city', 'founded',
            'primary_kit_color', 'secondary_kit_color', 'coach_full_name',
            'assistant_full_name', 'captain_full_name', 'contact_phone',
            'contact_email', 'social_media', 'description', 'participation_fee',
            'status', 'website', 'is_active'
        ]
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            try:
                return request.build_absolute_uri(obj.logo.url) if request else obj.logo.url
            except:
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
    club_id = serializers.IntegerField(source='club.id', read_only=True)
    club_logo = serializers.SerializerMethodField()
    goals_formatted = serializers.CharField(read_only=True)
    goal_difference = serializers.IntegerField(read_only=True)
    last_5 = serializers.ListField(read_only=True)
    
    class Meta:
        model = ClubSeason
        fields = [
            'id', 'club_id', 'club_name', 'club_logo', 'position', 'points',
            'matches_played', 'wins', 'draws', 'losses',
            'goals_for', 'goals_against', 'goals_formatted', 'goal_difference', 'last_5'
        ] 

    def get_club_logo(self, obj):
        if obj.club and obj.club.logo:
            request = self.context.get('request')
            url = obj.club.logo.url
            try:
                return request.build_absolute_uri(url) if request else url
            except:
                return url
        return None


class ClubApplicationSerializer(serializers.ModelSerializer):
    """Сериализатор для заявки клуба."""
    
    logo_url = serializers.SerializerMethodField()
    season_name = serializers.CharField(source='season.name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True)
    
    class Meta:
        model = ClubApplication
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at', 'reviewed_at', 'reviewed_by', 'club']
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            try:
                return request.build_absolute_uri(obj.logo.url) if request else obj.logo.url
            except:
                return obj.logo.url
        return None


class ClubApplicationListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка заявок клубов."""
    
    logo_url = serializers.SerializerMethodField()
    season_name = serializers.CharField(source='season.name', read_only=True)
    
    class Meta:
        model = ClubApplication
        fields = [
            'id', 'club_name', 'short_name', 'city', 'logo_url',
            'contact_person', 'contact_phone', 'status', 'season_name',
            'created_at', 'reviewed_at'
        ]
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            try:
                return request.build_absolute_uri(obj.logo.url) if request else obj.logo.url
            except:
                return obj.logo.url
        return None


class ClubApplicationDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детальной информации о заявке клуба."""
    
    logo_url = serializers.SerializerMethodField()
    season_name = serializers.CharField(source='season.name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.username', read_only=True)
    
    class Meta:
        model = ClubApplication
        fields = '__all__'
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            try:
                return request.build_absolute_uri(obj.logo.url) if request else obj.logo.url
            except:
                return obj.logo.url
        return None