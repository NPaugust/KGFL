from rest_framework import serializers
from .models import Match, Goal, Card, Substitution
from datetime import datetime


class MatchCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания матчей."""
    
    date = serializers.DateField(required=False, allow_null=True)
    season = serializers.PrimaryKeyRelatedField(read_only=True)
    home_team = serializers.PrimaryKeyRelatedField(queryset=Match._meta.get_field('home_team').related_model.objects.all(), required=False)
    away_team = serializers.PrimaryKeyRelatedField(queryset=Match._meta.get_field('away_team').related_model.objects.all(), required=False)
    
    def validate_date(self, value):
        """Преобразуем datetime в date."""
        if not value:
            return None
        if isinstance(value, str):
            try:
                # Парсим date строку
                from datetime import datetime
                dt = datetime.strptime(value, '%Y-%m-%d')
                return dt.date()
            except ValueError:
                raise serializers.ValidationError("Неверный формат даты")
        elif hasattr(value, 'date'):
            return value.date()
        return value
    
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
        model = Match
        fields = '__all__'


class MatchSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Match."""
    
    home_team_name = serializers.CharField(source='home_team.name', read_only=True)
    away_team_name = serializers.CharField(source='away_team.name', read_only=True)
    home_team_logo = serializers.CharField(source='home_team.logo', read_only=True)
    away_team_logo = serializers.CharField(source='away_team.logo', read_only=True)
    season_name = serializers.CharField(source='season.name', read_only=True)
    
    class Meta:
        model = Match
        fields = '__all__'


class MatchListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка матчей."""
    
    home_team_name = serializers.CharField(source='home_team.name', read_only=True)
    away_team_name = serializers.CharField(source='away_team.name', read_only=True)
    home_team_logo = serializers.CharField(source='home_team.logo', read_only=True)
    away_team_logo = serializers.CharField(source='away_team.logo', read_only=True)
    
    class Meta:
        model = Match
        fields = [
            'id', 'home_team_name', 'away_team_name', 'home_team_logo', 'away_team_logo',
            'date', 'time', 'status', 'home_score', 'away_score', 'stadium', 'round'
        ]


class GoalSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Goal."""
    
    scorer_name = serializers.CharField(source='scorer.full_name', read_only=True)
    assist_name = serializers.CharField(source='assist.full_name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    
    class Meta:
        model = Goal
        fields = '__all__'


class CardSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Card."""
    
    player_name = serializers.CharField(source='player.full_name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    
    class Meta:
        model = Card
        fields = '__all__'


class SubstitutionSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Substitution."""
    
    player_in_name = serializers.CharField(source='player_in.full_name', read_only=True)
    player_out_name = serializers.CharField(source='player_out.full_name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    
    class Meta:
        model = Substitution
        fields = '__all__'


class MatchDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детальной информации о матче."""
    
    home_team_name = serializers.CharField(source='home_team.name', read_only=True)
    away_team_name = serializers.CharField(source='away_team.name', read_only=True)
    home_team_logo = serializers.CharField(source='home_team.logo', read_only=True)
    away_team_logo = serializers.CharField(source='away_team.logo', read_only=True)
    season_name = serializers.CharField(source='season.name', read_only=True)
    goals = GoalSerializer(many=True, read_only=True)
    cards = CardSerializer(many=True, read_only=True)
    substitutions = SubstitutionSerializer(many=True, read_only=True)
    
    class Meta:
        model = Match
        fields = '__all__' 