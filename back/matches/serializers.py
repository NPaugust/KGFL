from rest_framework import serializers
from .models import Match, Goal, Card, Substitution, Stadium, Assist
from clubs.models import Club
from core.models import Season
from datetime import datetime


class MatchCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания матчей."""
    
    # Дополнительные поля для событий (не сохраняются в модели Match)
    goals = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    assists = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    yellow_cards = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    red_cards = serializers.ListField(child=serializers.DictField(), required=False, write_only=True)
    
    class Meta:
        model = Match
        fields = '__all__'
    
    def validate(self, attrs):
        """Валидация данных матча."""
        status = attrs.get('status')
        home_team = attrs.get('home_team')
        away_team = attrs.get('away_team')
        season = attrs.get('season')
        group = attrs.get('group')
        
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
        
        # ВАЛИДАЦИЯ ГРУПП: если сезон с группами, проверяем целостность
        if season and season.format == 'groups':
            from clubs.models import ClubSeason
            
            # Если указана группа, проверяем что она принадлежит сезону
            if group:
                if group.season != season:
                    raise serializers.ValidationError({
                        'group': 'Группа должна принадлежать выбранному сезону'
                    })
            
            # Проверяем, что обе команды участвуют в сезоне
            if home_team and away_team:
                home_club_season = ClubSeason.objects.filter(
                    club=home_team, 
                    season=season
                ).first()
                away_club_season = ClubSeason.objects.filter(
                    club=away_team, 
                    season=season
                ).first()
                
                if not home_club_season:
                    raise serializers.ValidationError({
                        'home_team': f'Команда "{home_team.name}" не участвует в сезоне "{season.name}"'
                    })
                
                if not away_club_season:
                    raise serializers.ValidationError({
                        'away_team': f'Команда "{away_team.name}" не участвует в сезоне "{season.name}"'
                    })
                
                # Если сезон с группами, обе команды должны быть в одной группе
                if home_club_season.group != away_club_season.group:
                    raise serializers.ValidationError({
                        'home_team': f'Команды должны быть из одной группы. "{home_team.name}" в группе "{home_club_season.group.name if home_club_season.group else "Без группы"}", а "{away_team.name}" в группе "{away_club_season.group.name if away_club_season.group else "Без группы"}"'
                    })
                
                # Если указана группа матча, она должна совпадать с группами команд
                if group:
                    if home_club_season.group != group or away_club_season.group != group:
                        raise serializers.ValidationError({
                            'group': f'Группа матча должна совпадать с группами команд. Команды в группе "{home_club_season.group.name if home_club_season.group else "Без группы"}"'
                        })
                else:
                    # Если группа не указана, но команды в группе - устанавливаем группу матча
                    if home_club_season.group:
                        attrs['group'] = home_club_season.group
        
        # Проверка наличия игроков в командах (предупреждение, не блокируем создание)
        warnings = {}
        
        if home_team and season:
            from players.models import Player
            home_players_count = Player.objects.filter(club=home_team, season=season, is_active=True).count()
            if home_players_count == 0:
                warnings['home_team'] = f'В клубе "{home_team.name}" нет активных игроков в выбранном сезоне. Матч можно создать, но события матча (голы, карточки) будут недоступны.'
        
        if away_team and season:
            from players.models import Player
            away_players_count = Player.objects.filter(club=away_team, season=season, is_active=True).count()
            if away_players_count == 0:
                warnings['away_team'] = f'В клубе "{away_team.name}" нет активных игроков в выбранном сезоне. Матч можно создать, но события матча (голы, карточки) будут недоступны.'
        
        # Если есть предупреждения, но мы не блокируем создание, просто добавляем их в контекст
        if warnings:
            # В Django REST Framework нельзя вернуть warnings напрямую, но можно их сохранить
            # Для простоты, просто пропускаем предупреждения - они будут видны при попытке добавить события
            pass
        
        return attrs
    
    def create(self, validated_data):
        """Создание матча с событиями."""
        # Если сезон не указан, используем активный сезон
        if not validated_data.get('season'):
            try:
                active_season = Season.objects.get(is_active=True)
                validated_data['season'] = active_season
            except Season.DoesNotExist:
                pass  # Если активного сезона нет, создаем без сезона
        
        # Извлекаем события из данных
        goals_data = validated_data.pop('goals', [])
        assists_data = validated_data.pop('assists', [])
        yellow_cards_data = validated_data.pop('yellow_cards', [])
        red_cards_data = validated_data.pop('red_cards', [])
        
        # Создаем матч
        match = super().create(validated_data)
        
        # Создаем события
        self._create_events(match, goals_data, assists_data, yellow_cards_data, red_cards_data)
        
        return match
    
    def update(self, instance, validated_data):
        """Обновление матча с событиями."""
        # Извлекаем события из данных
        goals_data = validated_data.pop('goals', [])
        assists_data = validated_data.pop('assists', [])
        yellow_cards_data = validated_data.pop('yellow_cards', [])
        red_cards_data = validated_data.pop('red_cards', [])
        
        # Сохраняем старый счёт для сравнения
        old_home_score = instance.home_score or 0
        old_away_score = instance.away_score or 0
        
        # Обновляем матч
        match = super().update(instance, validated_data)
        
        # Новый счёт после обновления
        new_home_score = match.home_score or 0
        new_away_score = match.away_score or 0
        
        # Создаем новые события из формы
        self._create_events(match, goals_data, assists_data, yellow_cards_data, red_cards_data)
        
        # Автоматически создаём недостающие голы если счёт увеличился
        self._sync_goals_with_score(match, old_home_score, old_away_score, new_home_score, new_away_score)
        
        return match
    
    def _create_events(self, match, goals_data, assists_data, yellow_cards_data, red_cards_data):
        """Создание событий матча."""
        from .models import Goal, Card
        from players.models import Player
        
        # Создаем голы
        for goal_data in goals_data:
            try:
                scorer_id = goal_data.get('player_id')
                minute = goal_data.get('minute', 1)
                team_type = goal_data.get('team')  # 'home' или 'away'
                
                if scorer_id and team_type:
                    scorer = Player.objects.get(id=scorer_id)
                    team = match.home_team if team_type == 'home' else match.away_team
                    
                    Goal.objects.create(
                        match=match,
                        scorer=scorer,
                        team=team,
                        minute=minute,
                        goal_type='goal'  # По умолчанию обычный гол
                    )
            except (Player.DoesNotExist, ValueError) as e:
                pass
        
        # Создаем желтые карточки
        for card_data in yellow_cards_data:
            try:
                player_id = card_data.get('player_id')
                minute = card_data.get('minute', 1)
                team_type = card_data.get('team')
                
                if player_id and team_type:
                    player = Player.objects.get(id=player_id)
                    team = match.home_team if team_type == 'home' else match.away_team
                    
                    Card.objects.create(
                        match=match,
                        player=player,
                        team=team,
                        minute=minute,
                        card_type='yellow'
                    )
            except (Player.DoesNotExist, ValueError) as e:
                pass
        
        # Создаем красные карточки
        for card_data in red_cards_data:
            try:
                player_id = card_data.get('player_id')
                minute = card_data.get('minute', 1)
                team_type = card_data.get('team')
                
                if player_id and team_type:
                    player = Player.objects.get(id=player_id)
                    team = match.home_team if team_type == 'home' else match.away_team
                    
                    Card.objects.create(
                        match=match,
                        player=player,
                        team=team,
                        minute=minute,
                        card_type='red'
                    )
            except (Player.DoesNotExist, ValueError) as e:
                pass
        
        # Создаем ассисты
        for assist_data in assists_data:
            try:
                player_id = assist_data.get('player_id')
                minute = assist_data.get('minute', 1)
                team_type = assist_data.get('team')
                
                if player_id and team_type:
                    player = Player.objects.get(id=player_id)
                    team = match.home_team if team_type == 'home' else match.away_team
                    
                    from .models import Assist
                    Assist.objects.create(
                        match=match,
                        player=player,
                        team=team,
                        minute=minute
                    )
            except (Player.DoesNotExist, ValueError) as e:
                pass
    
    def _sync_goals_with_score(self, match, old_home, old_away, new_home, new_away):
        """Синхронизация событий Goal с изменениями счёта."""
        from .models import Goal
        from players.models import Player
        
        # Получаем текущие голы матча
        home_goals = Goal.objects.filter(match=match, team=match.home_team).count()
        away_goals = Goal.objects.filter(match=match, team=match.away_team).count()
        
        
        # Создаём недостающие голы для домашней команды
        if new_home > home_goals:
            needed_home = new_home - home_goals
            self._create_auto_goals(match, match.home_team, needed_home)
        
        # Создаём недостающие голы для гостевой команды  
        if new_away > away_goals:
            needed_away = new_away - away_goals
            self._create_auto_goals(match, match.away_team, needed_away)
        
        # Удаляем лишние голы если счёт уменьшился
        if new_home < home_goals:
            excess_home = home_goals - new_home
            # Получаем ID голов для удаления
            goals_to_delete = Goal.objects.filter(match=match, team=match.home_team).order_by('-id')[:excess_home].values_list('id', flat=True)
            Goal.objects.filter(id__in=list(goals_to_delete)).delete()
            
        if new_away < away_goals:
            excess_away = away_goals - new_away
            # Получаем ID голов для удаления
            goals_to_delete = Goal.objects.filter(match=match, team=match.away_team).order_by('-id')[:excess_away].values_list('id', flat=True)
            Goal.objects.filter(id__in=list(goals_to_delete)).delete()
    
    def _create_auto_goals(self, match, team, count):
        """Создание автоматических голов."""
        from .models import Goal
        from players.models import Player
        
        # Берём первого активного игрока команды для автоголов
        try:
            player = Player.objects.filter(club=team, is_active=True).first()
            if not player:
                player = Player.objects.filter(club=team).first()
            
            if player:
                for i in range(count):
                    Goal.objects.create(
                        match=match,
                        scorer=player,
                        team=team,
                        minute=1,  # Автоголы в 1-ю минуту
                        goal_type='goal',
                        description='Автоматически созданный гол'
                    )
            else:
                pass
        except Exception as e:
            pass


class MatchSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Match."""
    
    home_team_name = serializers.CharField(source='home_team.name', read_only=True)
    away_team_name = serializers.CharField(source='away_team.name', read_only=True)
    home_team_logo = serializers.SerializerMethodField()
    away_team_logo = serializers.SerializerMethodField()
    home_team = serializers.SerializerMethodField()
    away_team = serializers.SerializerMethodField()
    season_name = serializers.CharField(source='season.name', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True, allow_null=True)
    group_id = serializers.IntegerField(source='group.id', read_only=True, allow_null=True)
    stadium_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Match
        fields = '__all__'
        extra_kwargs = {
            'stadium_name': {'read_only': True}
        }

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

    def get_stadium_name(self, obj):
        """Получить название стадиона."""
        if hasattr(obj, 'stadium_ref') and obj.stadium_ref:
            return obj.stadium_ref.name
        elif hasattr(obj, 'stadium') and obj.stadium:
            return obj.stadium
        return None


class MatchListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка матчей."""
    
    home_team_name = serializers.CharField(source='home_team.name', read_only=True)
    away_team_name = serializers.CharField(source='away_team.name', read_only=True)
    season_name = serializers.CharField(source='season.name', read_only=True, allow_null=True)
    group_name = serializers.CharField(source='group.name', read_only=True, allow_null=True)
    group_id = serializers.IntegerField(source='group.id', read_only=True, allow_null=True)
    home_team_logo = serializers.SerializerMethodField()
    away_team_logo = serializers.SerializerMethodField()
    home_team = serializers.SerializerMethodField()
    away_team = serializers.SerializerMethodField()
    stadium_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Match
        fields = [
            'id', 'home_team_name', 'away_team_name', 'home_team_logo', 'away_team_logo',
            'home_team', 'away_team', 'season', 'season_name', 'group', 'group_name', 'group_id',
            'date', 'time', 'status', 'home_score', 'away_score', 'round', 'stadium', 'stadium_ref', 'stadium_name'
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

    def get_stadium_name(self, obj):
        """Получить название стадиона."""
        if hasattr(obj, 'stadium_ref') and obj.stadium_ref:
            return obj.stadium_ref.name
        elif hasattr(obj, 'stadium') and obj.stadium:
            return obj.stadium
        return None


class GoalSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Goal."""
    
    scorer_name = serializers.CharField(source='scorer.full_name', read_only=True)
    assist_name = serializers.CharField(source='assist.full_name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    
    class Meta:
        model = Goal
        fields = '__all__'
        read_only_fields = ['match']  # match не должен изменяться при обновлении

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
        read_only_fields = ['match']  # match не должен изменяться при обновлении

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
    stadium_name = serializers.CharField(source='stadium.name', read_only=True)
    stadium_ref_name = serializers.CharField(source='stadium_ref.name', read_only=True)
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


class StadiumSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stadium
        fields = '__all__'
        extra_kwargs = {
            'address': {'required': False, 'allow_blank': True},
            'city': {'required': False, 'allow_blank': True},
            'capacity': {'required': False, 'allow_null': True},
        }


class AssistSerializer(serializers.ModelSerializer):
    player_name = serializers.CharField(source='player.full_name', read_only=True)
    team_name = serializers.CharField(source='team.name', read_only=True)
    
    class Meta:
        model = Assist
        fields = ['id', 'match', 'player', 'player_name', 'team', 'team_name', 'minute', 'created_at']
        read_only_fields = ['match']  # match не должен изменяться при обновлении