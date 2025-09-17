from rest_framework import serializers
from .models import Player, PlayerStats, PlayerTransfer
from core.models import Season
from clubs.models import Club


class PlayerCreateSerializer(serializers.ModelSerializer):
    """Сериализатор для создания игроков.

    Делает часть полей необязательными и корректно интерпретирует пустые строки
    как null для FK/необязательных полей, чтобы избежать 400 на фронте.
    """
    
    # Явно делаем сезон и клуб необязательными
    season = serializers.PrimaryKeyRelatedField(queryset=Season.objects.all(), required=False, allow_null=True)

    class Meta:
        model = Player
        fields = '__all__'
        extra_kwargs = {
            'club': {'required': False, 'allow_null': True},
            'number': {'required': False, 'allow_null': True},
            'height': {'required': False, 'allow_null': True},
            'weight': {'required': False, 'allow_null': True},
            'phone': {'required': False, 'allow_null': True, 'allow_blank': True},
            'notes': {'required': False, 'allow_null': True, 'allow_blank': True},
            'photo': {'required': False, 'allow_null': True},
            'season': {'required': False, 'allow_null': True},
            'nationality': {'required': False, 'allow_blank': True},
        }
        # Отключаем авто-валидатор уникальности, реализуем вручную ниже,
        # чтобы поле season не становилось обязательным
        validators = []

    def to_internal_value(self, data):
        # Преобразуем пустые строки в None для корректной валидации
        mutable = data.copy()
        for key in ['club', 'season', 'height', 'weight', 'phone', 'notes', 'nationality', 'number']:
            if key in mutable and (mutable[key] == '' or mutable[key] is None):
                mutable[key] = None
        return super().to_internal_value(mutable)

    def validate(self, attrs):
        """Мягкая проверка уникальности номера в пределах клуба и сезона.
        Если сезон не задан, пропускаем проверку.
        """
        # Запрет будущей даты рождения
        dob = attrs.get('date_of_birth')
        if dob is not None:
            from datetime import date
            if dob > date.today():
                raise serializers.ValidationError({
                    'date_of_birth': 'Дата рождения не может быть в будущем.'
                })

        club = attrs.get('club')
        season = attrs.get('season')
        number = attrs.get('number')
        if club and season and number is not None:
            from .models import Player
            qs = Player.objects.filter(club=club, season=season, number=number)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    'number': 'Игровой номер должен быть уникален в рамках клуба и сезона.'
                })
        return attrs

    def create(self, validated_data):
        # Если сезон не указан, пытаемся проставить активный
        if not validated_data.get('season'):
            try:
                from core.models import Season
                active = Season.objects.get(is_active=True)
                validated_data['season'] = active
            except Exception:
                # Активного сезона нет — создаём без него
                pass
        return super().create(validated_data)


class PlayerSerializer(serializers.ModelSerializer):
    """Сериализатор для модели Player."""
    
    club_name = serializers.SerializerMethodField()
    club_logo = serializers.SerializerMethodField()
    season_name = serializers.CharField(source='season.name', read_only=True)
    photo_url = serializers.SerializerMethodField()
    matches_played = serializers.SerializerMethodField()
    goals_scored = serializers.SerializerMethodField()
    assists = serializers.SerializerMethodField()
    yellow_cards = serializers.SerializerMethodField()
    red_cards = serializers.SerializerMethodField()
    
    def get_club_name(self, obj):
        """Получить название клуба игрока."""
        if obj.club:
            return obj.club.name
        return 'Без клуба'
    
    def get_photo_url(self, obj):
        if obj.photo and hasattr(obj.photo, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None
    
    def get_club_logo(self, obj):
        """Получить логотип клуба игрока."""
        if obj.club and obj.club.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.club.logo.url)
            return obj.club.logo.url
        return None
    
    def get_goals_scored(self, obj):
        """Получить количество голов игрока."""
        from core.models import Season
        try:
            current_season = Season.objects.get(is_active=True)
            stats = obj.stats.filter(season=current_season).first()
            return stats.goals if stats else 0
        except (Season.DoesNotExist, AttributeError):
            return 0
    
    def get_assists(self, obj):
        """Получить количество ассистов игрока."""
        from core.models import Season
        try:
            current_season = Season.objects.get(is_active=True)
            stats = obj.stats.filter(season=current_season).first()
            return stats.assists if stats else 0
        except (Season.DoesNotExist, AttributeError):
            return 0
    
    def get_yellow_cards(self, obj):
        """Получить количество желтых карточек игрока."""
        from core.models import Season
        try:
            current_season = Season.objects.get(is_active=True)
            stats = obj.stats.filter(season=current_season).first()
            return stats.yellow_cards if stats else 0
        except (Season.DoesNotExist, AttributeError):
            return 0
    
    def get_red_cards(self, obj):
        """Получить количество красных карточек игрока."""
        from core.models import Season
        try:
            current_season = Season.objects.get(is_active=True)
            stats = obj.stats.filter(season=current_season).first()
            return stats.red_cards if stats else 0
        except (Season.DoesNotExist, AttributeError):
            return 0
    
    def get_matches_played(self, obj):
        """Получить количество сыгранных матчей игрока."""
        from core.models import Season
        try:
            current_season = Season.objects.get(is_active=True)
            stats = obj.stats.filter(season=current_season).first()
            return stats.matches_played if stats else 0
        except (Season.DoesNotExist, AttributeError):
            return 0
    
    class Meta:
        model = Player
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'photo', 'photo_url', 
            'position', 'number', 'club', 'club_name', 'club_logo', 'season', 'season_name',
            'date_of_birth', 'nationality', 'height', 'weight', 'phone', 'notes', 
            'status', 'is_active', 'goals_scored', 'assists', 'yellow_cards', 
            'red_cards', 'matches_played', 'created_at', 'updated_at'
        ]
        extra_kwargs = {
            'photo': {'required': False},
            'phone': {'required': False, 'allow_null': True, 'allow_blank': True},
            'notes': {'required': False, 'allow_null': True, 'allow_blank': True},
            'nationality': {'required': False, 'allow_blank': True},
        }



class PlayerListSerializer(serializers.ModelSerializer):
    """Сериализатор для списка игроков."""
    
    club_name = serializers.CharField(source='club.name', read_only=True)
    photo_url = serializers.SerializerMethodField()
    club_logo = serializers.SerializerMethodField()
    goals_scored = serializers.SerializerMethodField()
    assists = serializers.SerializerMethodField()
    yellow_cards = serializers.SerializerMethodField()
    red_cards = serializers.SerializerMethodField()
    matches_played = serializers.SerializerMethodField()
    
    class Meta:
        model = Player
        fields = [
            'id', 'first_name', 'last_name', 'photo', 'photo_url', 'position', 
            'number', 'club', 'club_name', 'club_logo', 'date_of_birth', 'nationality', 
            'height', 'weight', 'phone', 'notes', 'status', 'is_active',
            'goals_scored', 'assists', 'yellow_cards', 'red_cards', 'matches_played'
        ]



    def get_goals_scored(self, obj):
        try:
            from core.models import Season
            active_season = Season.objects.get(is_active=True)
            stats = obj.stats.filter(season=active_season).first()
            return stats.goals if stats else 0
        except (Season.DoesNotExist, AttributeError):
            return 0

    def get_assists(self, obj):
        try:
            from core.models import Season
            active_season = Season.objects.get(is_active=True)
            stats = obj.stats.filter(season=active_season).first()
            return stats.assists if stats else 0
        except (Season.DoesNotExist, AttributeError):
            return 0

    def get_yellow_cards(self, obj):
        try:
            from core.models import Season
            active_season = Season.objects.get(is_active=True)
            stats = obj.stats.filter(season=active_season).first()
            return stats.yellow_cards if stats else 0
        except (Season.DoesNotExist, AttributeError):
            return 0

    def get_red_cards(self, obj):
        try:
            from core.models import Season
            active_season = Season.objects.get(is_active=True)
            stats = obj.stats.filter(season=active_season).first()
            return stats.red_cards if stats else 0
        except (Season.DoesNotExist, AttributeError):
            return 0
    
    def get_matches_played(self, obj):
        """Получить количество сыгранных матчей игрока."""
        try:
            from core.models import Season
            current_season = Season.objects.get(is_active=True)
            stats = obj.stats.filter(season=current_season).first()
            return stats.matches_played if stats else 0
        except (Season.DoesNotExist, AttributeError):
            return 0

    def get_photo_url(self, obj):
        if obj.photo and hasattr(obj.photo, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None
    
    def get_club_logo(self, obj):
        if obj.club and obj.club.logo and hasattr(obj.club.logo, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.club.logo.url)
            return obj.club.logo.url
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
        if obj.photo and hasattr(obj.photo, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.photo.url)
            return obj.photo.url
        return None


class PlayerStatsSerializer(serializers.ModelSerializer):
    """Сериализатор для модели PlayerStats."""
    
    player_name = serializers.CharField(source='player.full_name', read_only=True)
    season_name = serializers.CharField(source='season.name', read_only=True)
    photo_url = serializers.SerializerMethodField()
    number = serializers.CharField(source='player.number', read_only=True)
    position = serializers.CharField(source='player.position', read_only=True)
    club = serializers.SerializerMethodField()
    
    class Meta:
        model = PlayerStats
        fields = '__all__'
    
    def get_photo_url(self, obj):
        """Получить URL фото игрока."""
        if obj.player and obj.player.photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.player.photo.url)
            return obj.player.photo.url
        return None
    
    def get_club(self, obj):
        """Получить информацию о клубе игрока."""
        if obj.player and obj.player.club:
            return {
                'id': obj.player.club.id,
                'name': obj.player.club.name,
                'logo': obj.player.club.logo.url if obj.player.club.logo else None
            }
        return None


class PlayerForTransferSerializer(serializers.ModelSerializer):
    """Сериализатор игрока для трансферов."""
    
    class Meta:
        model = Player
        fields = ['id', 'first_name', 'last_name', 'full_name', 'photo']


class ClubForTransferSerializer(serializers.ModelSerializer):
    """Сериализатор клуба для трансферов."""
    
    logo_url = serializers.SerializerMethodField()
    
    def get_logo_url(self, obj):
        if obj.logo and hasattr(obj.logo, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None
    
    class Meta:
        model = Club
        fields = ['id', 'name', 'logo', 'logo_url']


class PlayerTransferSerializer(serializers.ModelSerializer):
    """Сериализатор для модели PlayerTransfer."""

    player = serializers.PrimaryKeyRelatedField(queryset=Player.objects.all())
    from_club = serializers.PrimaryKeyRelatedField(queryset=Club.objects.all(), allow_null=True, required=False)
    to_club = serializers.PrimaryKeyRelatedField(queryset=Club.objects.all())
    season = serializers.PrimaryKeyRelatedField(queryset=Season.objects.all(), allow_null=True, required=False)
    player_full_name = serializers.CharField(source='player.full_name', read_only=True)

    class Meta:
        model = PlayerTransfer
        fields = '__all__'

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        context = self.context
        representation['player'] = PlayerForTransferSerializer(instance.player, context=context).data
        if instance.from_club:
            representation['from_club'] = ClubForTransferSerializer(instance.from_club, context=context).data
        else:
            representation['from_club'] = None
        representation['to_club'] = ClubForTransferSerializer(instance.to_club, context=context).data
        return representation


class TopScorerSerializer(serializers.ModelSerializer):
    """Сериализатор для лучших бомбардиров."""
    
    id = serializers.CharField(source='player.id', read_only=True)
    first_name = serializers.CharField(source='player.first_name', read_only=True)
    last_name = serializers.CharField(source='player.last_name', read_only=True)
    photo = serializers.CharField(source='player.photo', read_only=True)
    photo_url = serializers.SerializerMethodField()
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
    
    def get_photo_url(self, obj):
        photo = getattr(obj.player, 'photo', None)
        if photo and hasattr(photo, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(photo.url)
            return photo.url
        return None
    
    class Meta:
        model = PlayerStats
        fields = [
            'id', 'first_name', 'last_name', 'photo', 'photo_url', 'number', 'position',
            'club', 'goals_scored', 'assists', 'yellow_cards', 'red_cards',
            'games_played', 'minutes_played', 'season'
        ] 