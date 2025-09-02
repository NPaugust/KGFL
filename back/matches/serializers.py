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
            # При создании/обновлении запланированного матча счет должен отсутствовать
            attrs['home_score'] = None
            attrs['away_score'] = None
        
        return attrs


class MatchSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Match."""
    
    home_team_name = serializers.CharField(source='home_team.name', read_only=True)
    away_team_name = serializers.CharField(source='away_team.name', read_only=True)
    home_team_logo = serializers.SerializerMethodField()
    away_team_logo = serializers.SerializerMethodField()
    home_team = serializers.SerializerMethodField()
    away_team = serializers.SerializerMethodField()
    season_name = serializers.CharField(source='season.name', read_only=True)
    
    class Meta:
        model = Match
        fields = '__all__'

    def _absolute_logo(self, logo):
        if not logo:
            return None
        request = self.context.get('request')
        url = logo.url if hasattr(logo, 'url') else str(logo)
        return request.build_absolute_uri(url) if request else url

    def get_home_team_logo(self, obj):
        return self._absolute_logo(getattr(obj.home_team, 'logo', None))

    def get_away_team_logo(self, obj):
        return self._absolute_logo(getattr(obj.away_team, 'logo', None))

    def _club_obj(self, club):
        if not club:
            return None
        return {
            'id': club.id,
            'name': club.name,
            'logo': self._absolute_logo(getattr(club, 'logo', None)),
        }

    def get_home_team(self, obj):
        return self._club_obj(obj.home_team)

    def get_away_team(self, obj):
        return self._club_obj(obj.away_team)


class MatchListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка матчей."""
    
    home_team_name = serializers.CharField(source='home_team.name', read_only=True)
    away_team_name = serializers.CharField(source='away_team.name', read_only=True)
    home_team_logo = serializers.SerializerMethodField()
    away_team_logo = serializers.SerializerMethodField()
    home_team = serializers.SerializerMethodField()
    away_team = serializers.SerializerMethodField()
    
    class Meta:
        model = Match
        fields = [
            'id', 'home_team_name', 'away_team_name', 'home_team_logo', 'away_team_logo',
            'home_team', 'away_team',
            'date', 'time', 'status', 'home_score', 'away_score', 'stadium', 'round'
        ]

    def _absolute_logo(self, logo):
        if not logo:
            return None
        request = self.context.get('request')
        url = logo.url if hasattr(logo, 'url') else str(logo)
        return request.build_absolute_uri(url) if request else url

    def get_home_team_logo(self, obj):
        return self._absolute_logo(getattr(obj.home_team, 'logo', None))

    def get_away_team_logo(self, obj):
        return self._absolute_logo(getattr(obj.away_team, 'logo', None))

    def _club_obj(self, club):
        if not club:
            return None
        return {
            'id': club.id,
            'name': club.name,
            'logo': self._absolute_logo(getattr(club, 'logo', None)),
        }

    def get_home_team(self, obj):
        return self._club_obj(obj.home_team)

    def get_away_team(self, obj):
        return self._club_obj(obj.away_team)


class GoalSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Goal."""
    
    scorer_name = serializers.CharField(source='scorer.full_name', read_only=True)
    assist_name = serializers.CharField(source='assist.full_name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    
    class Meta:
        model = Goal
        fields = '__all__'

    def validate(self, attrs):
        match = attrs.get('match') or getattr(self.instance, 'match', None)
        team = attrs.get('team') or getattr(self.instance, 'team', None)
        scorer = attrs.get('scorer') or getattr(self.instance, 'scorer', None)
        assist = attrs.get('assist') or getattr(self.instance, 'assist', None)
        minute = attrs.get('minute') or getattr(self.instance, 'minute', None)

        errors = {}
        if minute is not None and (minute < 0 or minute > 130):
            errors['minute'] = 'Минуты должны быть в диапазоне 0..130'

        if match and team:
            if team_id := getattr(team, 'id', team):
                valid_team_ids = [getattr(match.home_team, 'id', None), getattr(match.away_team, 'id', None)]
                if team_id not in valid_team_ids:
                    errors['team'] = 'Команда должна быть одной из участников матча'

        def player_club_id(player):
            club = getattr(player, 'club', None)
            return getattr(club, 'id', None)

        if match and scorer:
            if player_club_id(scorer) not in [getattr(match.home_team, 'id', None), getattr(match.away_team, 'id', None)]:
                errors['scorer'] = 'Игрок‑автор гола должен принадлежать одной из команд матча'

        if assist and match:
            if player_club_id(assist) not in [getattr(match.home_team, 'id', None), getattr(match.away_team, 'id', None)]:
                errors['assist'] = 'Игрок‑ассистент должен принадлежать одной из команд матча'

        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class CardSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Card."""
    
    player_name = serializers.CharField(source='player.full_name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    
    class Meta:
        model = Card
        fields = '__all__'

    def validate(self, attrs):
        match = attrs.get('match') or getattr(self.instance, 'match', None)
        team = attrs.get('team') or getattr(self.instance, 'team', None)
        player = attrs.get('player') or getattr(self.instance, 'player', None)
        minute = attrs.get('minute') or getattr(self.instance, 'minute', None)

        errors = {}
        if minute is not None and (minute < 0 or minute > 130):
            errors['minute'] = 'Минуты должны быть в диапазоне 0..130'

        if match and team:
            valid_team_ids = [getattr(match.home_team, 'id', None), getattr(match.away_team, 'id', None)]
            if getattr(team, 'id', team) not in valid_team_ids:
                errors['team'] = 'Команда должна быть одной из участников матча'

        if match and player:
            player_club = getattr(getattr(player, 'club', None), 'id', None)
            if player_club not in [getattr(match.home_team, 'id', None), getattr(match.away_team, 'id', None)]:
                errors['player'] = 'Игрок должен принадлежать одной из команд матча'

        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class SubstitutionSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Substitution."""
    
    player_out_name = serializers.CharField(source='player_out.full_name', read_only=True)
    player_in_name = serializers.CharField(source='player_in.full_name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    
    class Meta:
        model = Substitution
        fields = '__all__'

    def validate(self, attrs):
        match = attrs.get('match') or getattr(self.instance, 'match', None)
        team = attrs.get('team') or getattr(self.instance, 'team', None)
        player_in = attrs.get('player_in') or getattr(self.instance, 'player_in', None)
        player_out = attrs.get('player_out') or getattr(self.instance, 'player_out', None)
        minute = attrs.get('minute') or getattr(self.instance, 'minute', None)

        errors = {}
        if minute is not None and (minute < 0 or minute > 130):
            errors['minute'] = 'Минуты должны быть в диапазоне 0..130'

        if player_in and player_out and player_in == player_out:
            errors['player_in'] = 'Игроки на вход и выход не могут совпадать'

        valid_team_ids = [getattr(match.home_team, 'id', None), getattr(match.away_team, 'id', None)] if match else []
        if match and team and getattr(team, 'id', team) not in valid_team_ids:
            errors['team'] = 'Команда должна быть одной из участников матча'

        def player_club_id(player):
            return getattr(getattr(player, 'club', None), 'id', None)

        if match and player_in and player_club_id(player_in) not in valid_team_ids:
            errors['player_in'] = 'Игрок (входит) должен принадлежать одной из команд матча'
        if match and player_out and player_club_id(player_out) not in valid_team_ids:
            errors['player_out'] = 'Игрок (уходит) должен принадлежать одной из команд матча'

        if errors:
            raise serializers.ValidationError(errors)
        return attrs


class MatchDetailSerializer(serializers.ModelSerializer):
    """Сериализатор для детальной информации о матче."""
    
    home_team_name = serializers.CharField(source='home_team.name', read_only=True)
    away_team_name = serializers.CharField(source='away_team.name', read_only=True)
    home_team_logo = serializers.SerializerMethodField()
    away_team_logo = serializers.SerializerMethodField()
    home_team = serializers.SerializerMethodField()
    away_team = serializers.SerializerMethodField()
    season_name = serializers.CharField(source='season.name', read_only=True)
    goals = GoalSerializer(many=True, read_only=True)
    cards = CardSerializer(many=True, read_only=True)
    substitutions = SubstitutionSerializer(many=True, read_only=True)
    home_team_players = serializers.SerializerMethodField()
    away_team_players = serializers.SerializerMethodField()
    
    class Meta:
        model = Match
        fields = '__all__'

    def _players_basic(self, club):
        if not club:
            return []
        from players.models import Player
        players = Player.objects.filter(club=club, is_active=True).order_by('number', 'last_name')
        return [
            {
                'id': p.id,
                'full_name': p.full_name,
                'number': p.number,
            }
            for p in players
        ]

    def get_home_team_players(self, obj):
        return self._players_basic(obj.home_team)

    def get_away_team_players(self, obj):
        return self._players_basic(obj.away_team)

    def _absolute_logo(self, logo):
        if not logo:
            return None
        request = self.context.get('request')
        url = logo.url if hasattr(logo, 'url') else str(logo)
        return request.build_absolute_uri(url) if request else url

    def _club_obj(self, club):
        if not club:
            return None
        return {
            'id': club.id,
            'name': club.name,
            'logo': self._absolute_logo(getattr(club, 'logo', None)),
        }

    def get_home_team(self, obj):
        return self._club_obj(obj.home_team)

    def get_away_team(self, obj):
        return self._club_obj(obj.away_team)

    def _absolute_logo(self, logo):
        if not logo:
            return None
        request = self.context.get('request')
        url = logo.url if hasattr(logo, 'url') else str(logo)
        return request.build_absolute_uri(url) if request else url

    def get_home_team_logo(self, obj):
        return self._absolute_logo(getattr(obj.home_team, 'logo', None))

    def get_away_team_logo(self, obj):
        return self._absolute_logo(getattr(obj.away_team, 'logo', None))