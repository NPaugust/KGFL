from rest_framework import serializers
from .models import Match, Goal, Card, Substitution
from clubs.models import Club
from core.models import Season
from datetime import datetime


class MatchCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания матчей."""
    
    class Meta:
        model = Match
        fields = '__all__'
    
    def validate(self, attrs):
        """Валидация данных матча."""
        status = attrs.get('status')
        
        # Если статус "Завершен", счет обязателен
        if status == 'finished':
            home_score = attrs.get('home_score')
            away_score = attrs.get('away_score')
            
            if home_score is None or away_score is None:
                raise serializers.ValidationError(
                    "Для завершенных матчей счет обязателен"
                )
            
            # Счет не может быть отрицательным
            if home_score < 0 or away_score < 0:
                raise serializers.ValidationError(
                    "Счет не может быть отрицательным"
                )
        
        # Если статус "Запланирован", счет должен быть null
        elif status == 'scheduled':
            attrs['home_score'] = None
            attrs['away_score'] = None
        
        return attrs


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
    
    player_out_name = serializers.CharField(source='player_out.full_name', read_only=True)
    player_in_name = serializers.CharField(source='player_in.full_name', read_only=True)
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