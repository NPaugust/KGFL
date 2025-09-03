#!/usr/bin/env python
import os
import django
from datetime import date, time, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kgfl.settings')
django.setup()

from core.models import Season, Partner, Media, Management
from clubs.models import Club, ClubSeason
from players.models import Player
from matches.models import Stadium, Match
from referees.models import Referee


def main():
    # 1) Season
    season, _ = Season.objects.get_or_create(
        name='2025',
        defaults={
            'start_date': date(2025, 1, 1),
            'end_date': date(2025, 12, 31),
            'is_active': True,
            'description': 'Тестовый сезон 2025'
        }
    )

    # 2) Clubs
    clubs_payload = [
        {'name': 'Кайрат', 'city': 'Алматы', 'coach_full_name': 'Иван Иванов', 'assistant_full_name': 'Петр Петров', 'contact_phone': '+7 777 111 1111', 'participation_fee': 'yes', 'status': 'active', 'primary_kit_color': '#FFD800', 'secondary_kit_color': '#000000'},
        {'name': 'Астана', 'city': 'Астана', 'coach_full_name': 'Сергей Сергеев', 'assistant_full_name': 'Игорь Игорев', 'contact_phone': '+7 777 222 2222', 'participation_fee': 'yes', 'status': 'active', 'primary_kit_color': '#0099FF', 'secondary_kit_color': '#FFFFFF'},
        {'name': 'Тобол', 'city': 'Костанай', 'coach_full_name': 'Андрей Андреев', 'assistant_full_name': 'Николай Николаев', 'contact_phone': '+7 777 333 3333', 'participation_fee': 'no', 'status': 'active', 'primary_kit_color': '#00B050', 'secondary_kit_color': '#FFFFFF'},
        {'name': 'Окжетпес', 'city': 'Кокшетау', 'coach_full_name': 'Олег Олегов', 'assistant_full_name': 'Максим Максимов', 'contact_phone': '+7 777 444 4444', 'participation_fee': 'partial', 'status': 'active', 'primary_kit_color': '#0033CC', 'secondary_kit_color': '#FFFFFF'},
    ]
    clubs = []
    for payload in clubs_payload:
        club, _ = Club.objects.get_or_create(name=payload['name'], defaults=payload)
        clubs.append(club)
        ClubSeason.objects.get_or_create(club=club, season=season, defaults={'points': 0, 'matches_played': 0, 'wins': 0, 'draws': 0, 'losses': 0, 'goals_for': 0, 'goals_against': 0, 'position': 1})

    # 3) Players (min: 4 per club)
    positions_cycle = ['GK', 'DF', 'MF', 'FW']
    for club in clubs:
        for idx in range(4):
            Player.objects.get_or_create(
                club=club,
                number=idx+1,
                first_name=f'Игрок{idx+1}',
                last_name=club.name,
                position=positions_cycle[idx % 4],
                date_of_birth=date(2000, 1, idx+1),
                defaults={
                    'nationality': 'Казахстан',
                    'status': 'active',
                    'phone': '+7 777 555 55 55'
                }
            )

    # 4) Referees (2)
    Referee.objects.get_or_create(first_name='Ержан', last_name='Судья', defaults={'category': 'national', 'region': 'Алматы', 'experience_months': 60})
    Referee.objects.get_or_create(first_name='Арман', last_name='Арбитров', defaults={'category': 'regional', 'region': 'Астана', 'experience_months': 36})

    # 5) Management (2)
    Management.objects.get_or_create(name='Токтарбай Токтарбаев', defaults={'position': 'Президент лиги', 'phone': '+7 777 000 0001'})
    Management.objects.get_or_create(name='Ержан Ержанов', defaults={'position': 'Генеральный секретарь', 'phone': '+7 777 000 0002'})

    # 6) Media (2) + Partners (2)
    Media.objects.get_or_create(title='Галерея открытия', defaults={'category': 'gallery'})
    Media.objects.get_or_create(title='Новость дня', defaults={'category': 'news'})
    Partner.objects.get_or_create(name='Halyk Bank', defaults={'category': 'main', 'website': 'https://halykbank.kz'})
    Partner.objects.get_or_create(name='Beeline', defaults={'category': 'official', 'website': 'https://beeline.kz'})

    # 7) Stadiums + Matches (simple round-robin 2 games)
    s1, _ = Stadium.objects.get_or_create(name='Центральный', defaults={'city': 'Алматы', 'capacity': 23000})
    s2, _ = Stadium.objects.get_or_create(name='Астана Арена', defaults={'city': 'Астана', 'capacity': 30000})

    # Two finished matches updating table via signals
    if len(clubs) >= 4:
        m1, _ = Match.objects.get_or_create(home_team=clubs[0], away_team=clubs[1], season=season, date=season.start_date or date(2025,1,10), defaults={'time': time(18,30), 'stadium': s1.name, 'status': 'finished', 'home_score': 2, 'away_score': 1})
        m2, _ = Match.objects.get_or_create(home_team=clubs[2], away_team=clubs[3], season=season, date=(season.start_date or date(2025,1,10))+timedelta(days=1), defaults={'time': time(19,0), 'stadium': s2.name, 'status': 'finished', 'home_score': 0, 'away_score': 0})

    print('Минимальные тестовые данные созданы.')


if __name__ == '__main__':
    main()
