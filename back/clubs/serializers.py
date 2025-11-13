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
    season_name = serializers.SerializerMethodField()
    group_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Club
        fields = [
            'id', 'name', 'short_name', 'logo', 'logo_url', 'city', 'founded',
            'primary_kit_color', 'secondary_kit_color', 'coach_full_name',
            'assistant_full_name', 'captain_full_name', 'contact_phone',
            'contact_email', 'social_media', 'description', 'participation_fee',
            'status', 'website', 'is_active', 'season_name', 'group_name'
        ]
    
    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            try:
                return request.build_absolute_uri(obj.logo.url) if request else obj.logo.url
            except:
                return obj.logo.url
        return None
    
    def get_season_name(self, obj):
        """Получаем имя сезона из самой последней записи ClubSeason."""
        latest_season = obj.seasons.order_by('-created_at').first()
        if latest_season and latest_season.season:
            return latest_season.season.name
        # Если у клуба нет сезона, возвращаем None (не отображаем "Без сезона")
        return None
    
    def get_group_name(self, obj):
        """Получаем имя группы из самой последней записи ClubSeason."""
        latest_season = obj.seasons.order_by('-created_at').first()
        if latest_season and latest_season.group:
            return latest_season.group.name
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
    group_name = serializers.CharField(source='group.name', read_only=True, allow_null=True)
    group_id = serializers.IntegerField(source='group.id', read_only=True, allow_null=True)
    
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
    goals_formatted = serializers.SerializerMethodField()
    goal_difference = serializers.IntegerField(read_only=True)
    last_5 = serializers.SerializerMethodField()
    group_name = serializers.CharField(source='group.name', read_only=True, allow_null=True)
    group_id = serializers.IntegerField(source='group.id', read_only=True, allow_null=True)
    id = serializers.IntegerField(read_only=True, required=False, allow_null=True)  # id может быть None для временных объектов
    
    class Meta:
        model = ClubSeason
        fields = [
            'id', 'club_id', 'club_name', 'club_logo', 'position', 'points',
            'matches_played', 'wins', 'draws', 'losses',
            'goals_for', 'goals_against', 'goals_formatted', 'goal_difference', 
            'last_5', 'group_id', 'group_name'
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
    
    def get_goals_formatted(self, obj):
        """Получаем форматированные голы."""
        try:
            return f"{obj.goals_for or 0}:{obj.goals_against or 0}"
        except:
            return "0:0"
    
    def get_last_5(self, obj):
        """Получаем результаты последних 5 матчей."""
        try:
            return obj.last_5
        except:
            return [None] * 5


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