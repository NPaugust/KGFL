#!/usr/bin/env python
"""
Скрипт для применения фото ыыы.png ко всем сущностям, где требуется фото
Запуск: python update_photos.py
"""

import os
import sys
import django
import shutil
from pathlib import Path

# Настройка Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kgfl.settings')
django.setup()

from players.models import Player
from referees.models import Referee
from management.models import Manager
from clubs.models import Club
from core.models import Media, Partner
from django.core.files.base import ContentFile

def copy_photo_to_media_dirs():
    """Копировать фото ыыы.png в нужные папки медиа"""
    
    source_photo = Path('ыыы.png')
    if not source_photo.exists():
        print("❌ Файл ыыы.png не найден!")
        return False
    
    media_root = Path('media')
    
    # Папки где нужно разместить фото
    target_dirs = [
        'players/photos',
        'referees',
        'management/photos', 
        'clubs/logos',
        'media',
        'partners'
    ]
    
    for target_dir in target_dirs:
        target_path = media_root / target_dir
        target_path.mkdir(parents=True, exist_ok=True)
        
        # Копируем файл с разными именами для разнообразия
        target_file = target_path / 'default_photo.png'
        shutil.copy2(source_photo, target_file)
        print(f"✅ Скопировано в {target_file}")
        
        # Создаем несколько копий с разными именами
        for i in range(1, 6):
            variant_file = target_path / f'photo_{i}.png'
            shutil.copy2(source_photo, variant_file)
            print(f"✅ Создан вариант {variant_file}")
    
    return True

def update_players_photos():
    """Обновить фото всех игроков"""
    players = Player.objects.all()
    
    photo_variants = [
        'players/photos/default_photo.png',
        'players/photos/photo_1.png',
        'players/photos/photo_2.png',
        'players/photos/photo_3.png',
        'players/photos/photo_4.png',
        'players/photos/photo_5.png'
    ]
    
    updated_count = 0
    for i, player in enumerate(players):
        photo_path = photo_variants[i % len(photo_variants)]
        player.photo = photo_path
        player.save()
        updated_count += 1
        if updated_count % 50 == 0:
            print(f"📸 Обновлено фото для {updated_count} игроков...")
    
    print(f"✅ Обновлено фото для {updated_count} игроков")

def update_referees_photos():
    """Обновить фото всех судей"""
    referees = Referee.objects.all()
    
    photo_variants = [
        'referees/default_photo.png',
        'referees/photo_1.png',
        'referees/photo_2.png',
        'referees/photo_3.png',
        'referees/photo_4.png',
        'referees/photo_5.png'
    ]
    
    updated_count = 0
    for i, referee in enumerate(referees):
        photo_path = photo_variants[i % len(photo_variants)]
        referee.photo = photo_path
        referee.save()
        updated_count += 1
    
    print(f"✅ Обновлено фото для {updated_count} судей")

def update_managers_photos():
    """Обновить фото всех менеджеров"""
    managers = Manager.objects.all()
    
    photo_variants = [
        'management/photos/default_photo.png',
        'management/photos/photo_1.png',
        'management/photos/photo_2.png',
        'management/photos/photo_3.png',
        'management/photos/photo_4.png',
        'management/photos/photo_5.png'
    ]
    
    updated_count = 0
    for i, manager in enumerate(managers):
        photo_path = photo_variants[i % len(photo_variants)]
        manager.photo = photo_path
        manager.save()
        updated_count += 1
    
    print(f"✅ Обновлено фото для {updated_count} менеджеров")

def update_clubs_logos():
    """Обновить логотипы всех клубов"""
    clubs = Club.objects.all()
    
    logo_variants = [
        'clubs/logos/default_photo.png',
        'clubs/logos/photo_1.png',
        'clubs/logos/photo_2.png',
        'clubs/logos/photo_3.png',
        'clubs/logos/photo_4.png',
        'clubs/logos/photo_5.png'
    ]
    
    updated_count = 0
    for i, club in enumerate(clubs):
        logo_path = logo_variants[i % len(logo_variants)]
        club.logo = logo_path
        club.save()
        updated_count += 1
    
    print(f"✅ Обновлено логотипов для {updated_count} клубов")

def create_media_items():
    """Создать медиа элементы с фото"""
    media_variants = [
        'media/default_photo.png',
        'media/photo_1.png',
        'media/photo_2.png',
        'media/photo_3.png',
        'media/photo_4.png',
        'media/photo_5.png'
    ]
    
    media_titles = [
        'Тренировка команды Дордой',
        'Матч чемпионата КГФЛ',
        'Церемония награждения',
        'Фото с болельщиками',
        'Командное фото сезона',
        'Момент гола в ворота',
        'Радость победы',
        'Футбольная атмосфера'
    ]
    
    created_count = 0
    for i, title in enumerate(media_titles):
        image_path = media_variants[i % len(media_variants)]
        
        media_item, created = Media.objects.get_or_create(
            title=title,
            defaults={
                'image': image_path,
                'category': 'gallery',
                'is_active': True,
                'order': i
            }
        )
        
        if created:
            created_count += 1
    
    print(f"✅ Создано {created_count} медиа элементов")

def create_partners():
    """Создать партнеров с логотипами"""
    partner_variants = [
        'partners/default_photo.png',
        'partners/photo_1.png',
        'partners/photo_2.png',
        'partners/photo_3.png',
        'partners/photo_4.png',
        'partners/photo_5.png'
    ]
    
    partners_data = [
        {'name': 'Главный спонсор КГФЛ', 'category': 'main'},
        {'name': 'Банк партнер', 'category': 'official'},
        {'name': 'Спортивный бренд', 'category': 'technical'},
        {'name': 'Медиа партнер', 'category': 'official'},
        {'name': 'Технический партнер', 'category': 'technical'},
    ]
    
    created_count = 0
    for i, partner_data in enumerate(partners_data):
        logo_path = partner_variants[i % len(partner_variants)]
        
        partner, created = Partner.objects.get_or_create(
            name=partner_data['name'],
            defaults={
                'logo': logo_path,
                'category': partner_data['category'],
                'is_active': True,
                'order': i,
                'description': f'Описание для {partner_data["name"]}'
            }
        )
        
        if created:
            created_count += 1
    
    print(f"✅ Создано {created_count} партнеров")

def main():
    """Главная функция"""
    print("🚀 Обновление фотографий для всех сущностей...")
    
    # Копируем фото в нужные папки
    if not copy_photo_to_media_dirs():
        return
    
    # Обновляем фото для всех сущностей
    update_players_photos()
    update_referees_photos()
    update_managers_photos()
    update_clubs_logos()
    create_media_items()
    create_partners()
    
    print("\n🎉 Все фотографии успешно обновлены!")
    print(f"📊 Статистика:")
    print(f"   👨‍💼 Игроков с фото: {Player.objects.count()}")
    print(f"   👨‍⚖️ Судей с фото: {Referee.objects.count()}")
    print(f"   💼 Менеджеров с фото: {Manager.objects.count()}")
    print(f"   ⚽ Клубов с логотипами: {Club.objects.count()}")
    print(f"   📸 Медиа элементов: {Media.objects.count()}")
    print(f"   🤝 Партнеров: {Partner.objects.count()}")

if __name__ == '__main__':
    main()
