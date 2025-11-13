from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.core.cache import cache
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .models import Club, Coach, ClubSeason, ClubApplication
from .serializers import (
    ClubSerializer, ClubListSerializer, ClubDetailSerializer,
    CoachSerializer, ClubSeasonSerializer, TableRowSerializer,
    ClubApplicationSerializer, ClubApplicationListSerializer, ClubApplicationDetailSerializer
)
import rest_framework.parsers
import logging

logger = logging.getLogger(__name__)


class ClubViewSet(viewsets.ModelViewSet):
    """ViewSet для управления клубами."""
    
    queryset = Club.objects.select_related().prefetch_related('seasons', 'players', 'coaches')
    serializer_class = ClubSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ClubListSerializer
        elif self.action == 'retrieve':
            return ClubDetailSerializer
        return ClubSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        
        # Фильтрация по сезону
        season_id = self.request.query_params.get('season')
        
        # Проверяем, что season_id не пустой и не None
        if season_id and season_id.strip():
            try:
                from core.models import Season
                season = Season.objects.get(id=season_id.strip())
                
                # Фильтруем клубы, которые участвуют в этом сезоне через ClubSeason
                club_ids = ClubSeason.objects.filter(season=season).values_list('club_id', flat=True).distinct()
                
                if club_ids:
                    qs = qs.filter(id__in=club_ids)
                else:
                    qs = qs.none()
            except Season.DoesNotExist:
                qs = qs.none()
            except Exception as e:
                qs = qs.none()
        else:
            # Если сезон не указан ("Все сезоны"), показываем все активные клубы
            # Они могут иметь или не иметь ClubSeason записи - это нормально
            pass  # Не фильтруем по сезону, показываем все клубы
        
        # Параметр ?all=1 возвращает все записи без фильтра is_active
        if self.request.GET.get('all'):
            return qs
        
        # Для публичных таблиц/поиска оставляем только активные
        if self.action in ['table', 'search', 'list']:
            qs = qs.filter(is_active=True)
        
        return qs
    
    def get_permissions(self):
        return super().get_permissions()
    
    def get_parsers(self):
        return [rest_framework.parsers.MultiPartParser(), rest_framework.parsers.FormParser(), rest_framework.parsers.JSONParser()]
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def create(self, request, *args, **kwargs):
        """Создание клуба с обработкой ошибок."""
        try:
            # Получаем season из запроса (может быть строка или число)
            season_id = request.data.get('season')
            group_id = request.data.get('group')  # Получаем группу
            season = None
            group = None
            
            if season_id:
                try:
                    from core.models import Season, Group
                    season_id_str = str(season_id).strip()
                    # Если season_id не пустой, пытаемся найти сезон
                    if season_id_str:
                        season = Season.objects.get(id=season_id_str)
                        
                        # Если указана группа, проверяем что она принадлежит сезону
                        if group_id:
                            try:
                                group_id_str = str(group_id).strip()
                                if group_id_str:  # Если не пустая строка
                                    group = Group.objects.get(id=group_id_str, season=season)
                            except Group.DoesNotExist:
                                pass
                            except Exception:
                                pass
                            # Если group_id пустая строка, group остается None
                except Season.DoesNotExist:
                    pass
                except Exception as e:
                    pass
            # Если season_id не указан или пустой ("Все сезоны"), создаем клуб БЕЗ привязки к сезону
            # Не присваиваем активный сезон автоматически - пользователь явно выбрал "Все сезоны"
            
            # Удаляем season и group из данных запроса, так как это не поля модели Club
            data = request.data.copy()
            if 'season' in data:
                del data['season']
            if 'group' in data:
                del data['group']
            
            # Убеждаемся, что клуб создается как активный (если не указано иначе)
            if 'is_active' not in data:
                data['is_active'] = True
            
            serializer = self.get_serializer(data=data)
            if serializer.is_valid():
                club = serializer.save()
                
                # Создаем ClubSeason для указанного сезона с группой (если указана)
                if season:
                    # Проверяем, что если сезон с группами, группа указана
                    if season.format == 'groups' and not group:
                        return Response({
                            'error': 'Для сезона с групповым этапом необходимо указать группу'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    ClubSeason.objects.get_or_create(
                        club=club,
                        season=season,
                        defaults={
                            'group': group,
                            'position': 0,
                            'points': 0,
                            'matches_played': 0,
                            'games': 0,
                            'wins': 0,
                            'draws': 0,
                            'losses': 0,
                            'goals_for': 0,
                            'goals_against': 0,
                            'goal_difference': 0
                        }
                    )
                    # Если ClubSeason уже существует, обновляем группу
                    if group:
                        ClubSeason.objects.filter(club=club, season=season).update(group=group)
                
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Ошибка при создании клуба: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def update(self, request, *args, **kwargs):
        """Обновление клуба с обработкой ошибок."""
        try:
            # Получаем season и group из запроса
            season_id = request.data.get('season')
            group_id = request.data.get('group')  # Получаем группу
            season = None
            group = None
            
            # Проверяем, был ли передан season в запросе явно
            # Если season_id это пустая строка '', значит пользователь выбрал "Все сезоны"
            # Если season_id отсутствует в request.data, значит поле не было изменено
            season_provided = 'season' in request.data
            
            # Проверяем, был ли передан group в запросе явно
            group_provided = 'group' in request.data
            
            if season_provided and season_id:
                try:
                    from core.models import Season, Group
                    season_id_str = str(season_id).strip()
                    # Если season_id не пустой, пытаемся найти сезон
                    if season_id_str:
                        season = Season.objects.get(id=season_id_str)
                        
                        # Если указана группа, проверяем что она принадлежит сезону
                        # Если group_id это пустая строка '', значит группа должна быть удалена (установлена в null)
                        if group_provided:
                            if group_id:
                                group_id_str = str(group_id).strip()
                                if group_id_str:  # Если не пустая строка
                                    try:
                                        group = Group.objects.get(id=group_id_str, season=season)
                                    except Group.DoesNotExist:
                                        pass
                                    except Exception:
                                        pass
                                # Если group_id пустая строка, group остается None (будет установлена в null)
                            else:
                                # Если group_id не указан или пустой, group = None
                                group = None
                        # Если group не был передан в запросе, group остается None (не изменяется)
                except Season.DoesNotExist:
                    pass
                except Exception as e:
                    pass
            
            # Удаляем season и group из данных запроса, так как это не поля модели Club
            data = request.data.copy()
            if 'season' in data:
                del data['season']
            if 'group' in data:
                del data['group']
            
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            serializer = self.get_serializer(instance, data=data, partial=partial)
            if serializer.is_valid():
                club = serializer.save()
                
                # Если season был явно передан в запросе (поле было изменено)
                if season_provided:
                    # Удаляем все существующие ClubSeason записи для этого клуба
                    ClubSeason.objects.filter(club=club).delete()
                    
                    # Если сезон указан (не пустая строка), создаем новую ClubSeason запись с группой
                    if season:
                        # Проверяем, что если сезон с группами, группа указана
                        if season.format == 'groups' and not group:
                            return Response({
                                'error': 'Для сезона с групповым этапом необходимо указать группу'
                            }, status=status.HTTP_400_BAD_REQUEST)
                        
                        ClubSeason.objects.create(
                            club=club,
                            season=season,
                            group=group,  # Добавляем группу (может быть None)
                            position=0,
                            points=0,
                            matches_played=0,
                            games=0,
                            wins=0,
                            draws=0,
                            losses=0,
                            goals_for=0,
                            goals_against=0,
                            goal_difference=0
                        )
                    # Если season пустой (выбрано "Все сезоны"), не создаем ClubSeason - клуб остается без сезона
                elif group_provided and not season_provided:
                    # Если изменилась только группа (season не менялся), обновляем существующие ClubSeason
                    # Проверяем, что если сезон с группами, группа указана
                    existing_club_seasons = ClubSeason.objects.filter(club=club)
                    for cs in existing_club_seasons:
                        if cs.season.format == 'groups' and not group:
                            return Response({
                                'error': 'Для сезона с групповым этапом необходимо указать группу'
                            }, status=status.HTTP_400_BAD_REQUEST)
                    ClubSeason.objects.filter(club=club).update(group=group)
                
                return Response(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Ошибка при обновлении клуба: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, *args, **kwargs):
        """Удаление клуба с обработкой ошибок."""
        try:
            instance = self.get_object()
            instance.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            from django.db.models.deletion import ProtectedError
            if isinstance(e, ProtectedError):
                return Response(
                    {'error': 'Невозможно удалить: есть связанные объекты. Удалите связанные записи или измените связи.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {'error': f'Ошибка при удалении клуба: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def by_season_group(self, request):
        """Получить клубы по сезону и группе."""
        from core.models import Season, Group
        from clubs.models import ClubSeason
        
        season_id = request.GET.get('season')
        group_id = request.GET.get('group')
        
        if not season_id:
            return Response({'error': 'Не указан сезон'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            season = Season.objects.get(id=season_id)
        except Season.DoesNotExist:
            return Response({'error': 'Сезон не найден'}, status=status.HTTP_404_NOT_FOUND)
        
        # Получаем ClubSeason для сезона
        club_seasons = ClubSeason.objects.filter(
            season=season,
            club__is_active=True
        ).select_related('club', 'group')
        
        # Если указана группа - фильтруем по ней
        if group_id:
            try:
                group = Group.objects.get(id=group_id, season=season)
                club_seasons = club_seasons.filter(group=group)
            except Group.DoesNotExist:
                return Response({'error': 'Группа не найдена'}, status=status.HTTP_404_NOT_FOUND)
        
        # Извлекаем клубы
        clubs = [cs.club for cs in club_seasons]
        serializer = self.get_serializer(clubs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        """Поиск клубов."""
        query = request.GET.get('q', '')
        if query:
            clubs = self.queryset.filter(
                Q(name__icontains=query) | 
                Q(city__icontains=query) | 
                Q(short_name__icontains=query)
            )
        else:
            clubs = self.queryset
        serializer = self.get_serializer(clubs, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def table(self, request):
        """Получить турнирную таблицу."""
        try:
            from core.models import Season, Group
            
            # Получаем сезон из параметров
            season_id = request.GET.get('season')
            group_id = request.GET.get('group')  # Новый параметр для фильтрации по группе
            
            # Проверяем, что season_id не пустой и не None
            if season_id and season_id.strip():
                # Если сезон указан, фильтруем по нему
                try:
                    season = Season.objects.get(id=season_id.strip())
                    
                    # Получаем ClubSeason объекты только для активных клубов в указанном сезоне
                    club_seasons = ClubSeason.objects.filter(
                        season=season,
                        club__is_active=True  # Только активные клубы
                    ).select_related('club', 'season', 'group')
                    
                    # Если указана группа - фильтруем по ней
                    if group_id and group_id.strip():
                        try:
                            group = Group.objects.get(id=group_id.strip(), season=season)
                            club_seasons = club_seasons.filter(group=group)
                        except Group.DoesNotExist:
                            return Response({'error': 'Группа не найдена'}, status=status.HTTP_404_NOT_FOUND)
                    
                    # Сортируем: сначала по группе (если есть), потом по позиции/очкам
                    if season.has_groups:
                        club_seasons = club_seasons.order_by('group__order', 'group__name', '-points', '-goal_difference', '-goals_for')
                    else:
                        club_seasons = club_seasons.order_by('-points', '-goal_difference', '-goals_for')
                    
                    # Устанавливаем позиции внутри каждой группы (если есть группы)
                    if season.has_groups and group_id:
                        # Позиции внутри конкретной группы
                        position = 1
                        for club_season in club_seasons:
                            club_season.position = position
                            if club_season.pk:
                                club_season.save()
                            position += 1
                    elif season.has_groups:
                        # Позиции внутри каждой группы отдельно
                        current_group = None
                        position = 1
                        for club_season in club_seasons:
                            if current_group != club_season.group:
                                current_group = club_season.group
                                position = 1
                            club_season.position = position
                            if club_season.pk:
                                club_season.save()
                            position += 1
                    else:
                        # Обычная таблица без групп
                        for i, club_season in enumerate(club_seasons, 1):
                            club_season.position = i
                            if club_season.pk:
                                club_season.save()
                    
                    # Если сезон с группами и группа не указана - возвращаем структурированные данные
                    if season.has_groups and not group_id:
                        # Группируем по группам
                        groups_data = {}
                        for club_season in club_seasons:
                            group_key = club_season.group.id if club_season.group else 'no_group'
                            if group_key not in groups_data:
                                groups_data[group_key] = {
                                    'group': {
                                        'id': club_season.group.id if club_season.group else None,
                                        'name': club_season.group.name if club_season.group else 'Без группы',
                                        'order': club_season.group.order if club_season.group else 999,
                                    },
                                    'teams': []
                                }
                            serializer = TableRowSerializer(club_season, context={'request': request})
                            groups_data[group_key]['teams'].append(serializer.data)
                        
                        # Сортируем группы по order и возвращаем как список
                        sorted_groups = sorted(groups_data.values(), key=lambda x: x['group']['order'])
                        return Response({
                            'season': {
                                'id': season.id,
                                'name': season.name,
                                'format': season.format,
                                'has_groups': True
                            },
                            'groups': sorted_groups
                        })
                    else:
                        # Обычный формат - просто список команд
                        serializer = TableRowSerializer(club_seasons, many=True, context={'request': request})
                        return Response(serializer.data)
                    
                except Season.DoesNotExist:
                    return Response({'error': 'Сезон не найден'}, status=status.HTTP_404_NOT_FOUND)
            else:
                # Если сезон не указан ("Все сезоны"), возвращаем агрегированные данные за все сезоны
                from django.db.models import Sum, F, Value
                from django.db.models.functions import Coalesce
                from django.db.models import IntegerField
                
                # Получаем ВСЕ активные клубы - это критично!
                all_active_clubs = list(Club.objects.filter(is_active=True))
                
                # Если активных клубов нет, проверяем все клубы
                if len(all_active_clubs) == 0:
                    all_clubs = list(Club.objects.all())
                    if len(all_clubs) > 0:
                        # Используем все клубы как fallback
                        all_active_clubs = all_clubs
                
                # Получаем агрегированные данные для клубов, у которых есть записи ClubSeason
                club_seasons_qs = ClubSeason.objects.filter(
                    club__is_active=True
                ).select_related('club').values('club').annotate(
                    total_points=Coalesce(Sum('points'), Value(0), output_field=IntegerField()),
                    total_goal_difference=Coalesce(Sum('goal_difference'), Value(0), output_field=IntegerField()),
                    total_goals_for=Coalesce(Sum('goals_for'), Value(0), output_field=IntegerField()),
                    total_matches_played=Coalesce(Sum('matches_played'), Value(0), output_field=IntegerField()),
                    total_wins=Coalesce(Sum('wins'), Value(0), output_field=IntegerField()),
                    total_draws=Coalesce(Sum('draws'), Value(0), output_field=IntegerField()),
                    total_losses=Coalesce(Sum('losses'), Value(0), output_field=IntegerField()),
                    total_goals_against=Coalesce(Sum('goals_against'), Value(0), output_field=IntegerField())
                )
                
                # Создаем словарь с агрегированными данными по club_id
                aggregated_stats = {}
                for item in club_seasons_qs:
                    club_id = item['club']
                    aggregated_stats[club_id] = {
                        'points': int(item.get('total_points', 0) or 0),
                        'goal_difference': int(item.get('total_goal_difference', 0) or 0),
                        'goals_for': int(item.get('total_goals_for', 0) or 0),
                        'matches_played': int(item.get('total_matches_played', 0) or 0),
                        'wins': int(item.get('total_wins', 0) or 0),
                        'draws': int(item.get('total_draws', 0) or 0),
                        'losses': int(item.get('total_losses', 0) or 0),
                        'goals_against': int(item.get('total_goals_against', 0) or 0)
                    }
                
                # Получаем первый сезон как placeholder (нужен для модели ClubSeason)
                first_season_obj = Season.objects.first()
                if not first_season_obj:
                    # Если нет сезонов вообще, возвращаем пустой список
                    club_seasons = []
                    for club in all_active_clubs:
                        try:
                            stats = aggregated_stats.get(club.id, {
                                'points': 0, 'goal_difference': 0, 'goals_for': 0,
                                'matches_played': 0, 'wins': 0, 'draws': 0, 'losses': 0,
                                'goals_against': 0
                            })
                            temp = ClubSeason(
                                club=club,
                                season=None,  # Без сезона
                                position=0,
                                points=stats['points'],
                                goal_difference=stats['goal_difference'],
                                goals_for=stats['goals_for'],
                                matches_played=stats['matches_played'],
                                wins=stats['wins'],
                                draws=stats['draws'],
                                losses=stats['losses'],
                                goals_against=stats['goals_against']
                            )
                            temp.pk = None
                            temp.id = None
                            club_seasons.append(temp)
                        except Exception as e:
                            logger.error(f'Ошибка при создании временного объекта для клуба {club.id}: {e}')
                            continue
                else:
                    # Создаем временные объекты ClubSeason для ВСЕХ активных клубов
                    temp_club_seasons = []
                    for club in all_active_clubs:
                        try:
                            # Получаем статистику для клуба (или нули, если нет ClubSeason записей)
                            stats = aggregated_stats.get(club.id, {
                                'points': 0,
                                'goal_difference': 0,
                                'goals_for': 0,
                                'matches_played': 0,
                                'wins': 0,
                                'draws': 0,
                                'losses': 0,
                                'goals_against': 0
                            })
                            
                            # Создаем временный ClubSeason объект без сохранения в БД
                            temp = ClubSeason(
                                club=club,
                                season=first_season_obj,
                                position=0,  # Позиция будет установлена после сортировки
                                points=stats['points'],
                                goal_difference=stats['goal_difference'],
                                goals_for=stats['goals_for'],
                                matches_played=stats['matches_played'],
                                wins=stats['wins'],
                                draws=stats['draws'],
                                losses=stats['losses'],
                                goals_against=stats['goals_against']
                            )
                            # Явно устанавливаем pk в None, чтобы объект не пытался сохраниться
                            temp.pk = None
                            temp.id = None  # Устанавливаем id в None для временных объектов
                            temp_club_seasons.append(temp)
                        except Exception as e:
                            # Пропускаем клубы с ошибками
                            continue
                    
                    # Сортируем по очкам, разнице мячей и забитым голам
                    temp_club_seasons.sort(key=lambda x: (-x.points, -x.goal_difference, -x.goals_for))
                    
                    # Устанавливаем позиции
                    for i, club_season in enumerate(temp_club_seasons, 1):
                        club_season.position = i
                    
                    club_seasons = temp_club_seasons
            
            serializer = TableRowSerializer(club_seasons, many=True, context={'request': request})
            data = serializer.data
            
            return Response(data)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': f'Ошибка при получении таблицы: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def players(self, request, pk=None):
        """Получить игроков клуба."""
        club = self.get_object()
        from core.models import Season
        from players.serializers import PlayerListSerializer
        
        # Получаем сезон из query параметров
        season_id = request.GET.get('season')
        if season_id:
            try:
                season = Season.objects.get(id=season_id)
                players = club.players.filter(season=season)
            except Season.DoesNotExist:
                return Response({'error': 'Сезон не найден'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Если сезон не указан, возвращаем всех игроков клуба (для обратной совместимости)
            players = club.players.all()
        
        serializer = PlayerListSerializer(players, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def matches(self, request, pk=None):
        """Получить матчи клуба."""
        club = self.get_object()
        from matches.models import Match
        from core.models import Season
        from matches.serializers import MatchListSerializer
        
        # Получаем сезон из query параметров или используем активный
        season_id = request.GET.get('season')
        if season_id:
            try:
                season = Season.objects.get(id=season_id)
                matches = Match.objects.filter(
                    Q(home_team=club) | Q(away_team=club),
                    season=season
                ).order_by('-date', '-time')
            except Season.DoesNotExist:
                return Response({'error': 'Сезон не найден'}, status=status.HTTP_404_NOT_FOUND)
        else:
            # Если сезон не указан, возвращаем все матчи клуба (для обратной совместимости)
            matches = Match.objects.filter(
                Q(home_team=club) | Q(away_team=club)
            ).order_by('-date', '-time')
        
        serializer = MatchListSerializer(matches, many=True, context={'request': request})
        return Response(serializer.data)


class CoachViewSet(viewsets.ModelViewSet):
    """ViewSet для управления тренерами."""
    
    queryset = Coach.objects.all()
    def get_queryset(self):
        qs = super().get_queryset()
        if self.action in ['list', 'by_club']:
            return qs.filter(is_active=True)
        return qs
    serializer_class = CoachSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        return super().get_permissions()
    
    @action(detail=False, methods=['get'])
    def by_club(self, request):
        """Получить тренеров по клубу."""
        club_id = request.GET.get('club_id')
        if club_id:
            coaches = self.queryset.filter(club_id=club_id, is_active=True)
        else:
            coaches = self.queryset.filter(is_active=True)
        serializer = self.get_serializer(coaches, many=True)
        return Response(serializer.data)


class ClubSeasonViewSet(viewsets.ModelViewSet):
    """ViewSet для управления сезонами клубов."""
    
    queryset = ClubSeason.objects.all()
    serializer_class = ClubSeasonSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_permissions(self):
        return super().get_permissions()

    @action(detail=False, methods=['get'])
    def table(self, request):
        """Получить турнирную таблицу."""
        from core.models import Season, Group
        
        season_id = request.GET.get('season_id')
        group_id = request.GET.get('group_id')  # Новый параметр
        
        if season_id:
            try:
                season = Season.objects.get(id=season_id)
            except Season.DoesNotExist:
                return Response({'error': 'Сезон не найден'}, status=status.HTTP_404_NOT_FOUND)
        else:
            try:
                season = Season.objects.get(is_active=True)
            except Season.DoesNotExist:
                return Response({'error': 'Активный сезон не найден'}, status=status.HTTP_404_NOT_FOUND)
        
        # Получаем ClubSeason объекты
        club_seasons = ClubSeason.objects.filter(season=season).select_related('club', 'season', 'group')
        
        # Если указана группа - фильтруем по ней
        if group_id:
            try:
                group = Group.objects.get(id=group_id, season=season)
                club_seasons = club_seasons.filter(group=group)
            except Group.DoesNotExist:
                return Response({'error': 'Группа не найдена'}, status=status.HTTP_404_NOT_FOUND)
        
        # Сортируем
        if season.has_groups:
            club_seasons = club_seasons.order_by('group__order', 'group__name', '-points', '-goal_difference', '-goals_for')
        else:
            club_seasons = club_seasons.order_by('-points', '-goal_difference', '-goals_for')
        
        # Устанавливаем позиции
        if season.has_groups and group_id:
            # Позиции внутри конкретной группы
            for i, club_season in enumerate(club_seasons, 1):
                club_season.position = i
                club_season.save()
        elif season.has_groups:
            # Позиции внутри каждой группы отдельно
            current_group = None
            position = 1
            for club_season in club_seasons:
                if current_group != club_season.group:
                    current_group = club_season.group
                    position = 1
                club_season.position = position
                club_season.save()
                position += 1
        else:
            # Обычная таблица
            for i, club_season in enumerate(club_seasons, 1):
                club_season.position = i
                club_season.save()
        
        # Если сезон с группами и группа не указана - возвращаем структурированные данные
        if season.has_groups and not group_id:
            # Группируем по группам
            groups_data = {}
            for club_season in club_seasons:
                group_key = club_season.group.id if club_season.group else 'no_group'
                if group_key not in groups_data:
                    groups_data[group_key] = {
                        'group': {
                            'id': club_season.group.id if club_season.group else None,
                            'name': club_season.group.name if club_season.group else 'Без группы',
                            'order': club_season.group.order if club_season.group else 999,
                        },
                        'teams': []
                    }
                serializer = TableRowSerializer(club_season, context={'request': request})
                groups_data[group_key]['teams'].append(serializer.data)
            
            # Сортируем группы по order и возвращаем как список
            sorted_groups = sorted(groups_data.values(), key=lambda x: x['group']['order'])
            return Response({
                'season': {
                    'id': season.id,
                    'name': season.name,
                    'format': season.format,
                    'has_groups': True
                },
                'groups': sorted_groups
            })
        else:
            # Обычный формат - просто список команд
            serializer = TableRowSerializer(club_seasons, many=True, context={'request': request})
            return Response(serializer.data)


class ClubApplicationViewSet(viewsets.ModelViewSet):
    """ViewSet для управления заявками клубов."""
    
    queryset = ClubApplication.objects.select_related('season', 'reviewed_by', 'club')
    serializer_class = ClubApplicationSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return ClubApplicationListSerializer
        elif self.action == 'retrieve':
            return ClubApplicationDetailSerializer
        return ClubApplicationSerializer
    
    def get_queryset(self):
        qs = super().get_queryset()
        # Фильтр по статусу
        status_filter = self.request.GET.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        # Фильтр по сезону
        season_id = self.request.GET.get('season_id')
        if season_id:
            qs = qs.filter(season_id=season_id)
        return qs
    
    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['request'] = self.request
        return context
    
    def get_parsers(self):
        return [rest_framework.parsers.MultiPartParser(), rest_framework.parsers.FormParser(), rest_framework.parsers.JSONParser()]
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Одобрить заявку клуба."""
        application = self.get_object()
        if application.status != ClubApplication.ApplicationStatus.PENDING:
            return Response(
                {'error': 'Можно одобрить только заявки со статусом "Ожидает рассмотрения"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            club = application.approve(request.user)
            serializer = self.get_serializer(application)
            return Response({
                'message': 'Заявка одобрена, клуб создан',
                'application': serializer.data,
                'club_id': club.id
            })
        except Exception as e:
            return Response(
                {'error': f'Ошибка при одобрении заявки: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Отклонить заявку клуба."""
        application = self.get_object()
        if application.status != ClubApplication.ApplicationStatus.PENDING:
            return Response(
                {'error': 'Можно отклонить только заявки со статусом "Ожидает рассмотрения"'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reason = request.data.get('reason', '')
        try:
            application.reject(request.user, reason)
            serializer = self.get_serializer(application)
            return Response({
                'message': 'Заявка отклонена',
                'application': serializer.data
            })
        except Exception as e:
            return Response(
                {'error': f'Ошибка при отклонении заявки: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )