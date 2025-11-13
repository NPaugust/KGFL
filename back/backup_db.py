#!/usr/bin/env python
"""
Скрипт для создания бэкапа базы данных и медиа файлов.
Использование: python backup_db.py
"""

import os
import sys
import shutil
import zipfile
from datetime import datetime
from pathlib import Path

# Добавляем путь к проекту
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

# Настройки Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kgfl.settings')
import django
django.setup()

from django.conf import settings

def create_backup():
    """Создает бэкап базы данных и медиа файлов."""
    
    # Создаем папку для бэкапов если её нет
    backups_dir = BASE_DIR / 'backups'
    backups_dir.mkdir(exist_ok=True)
    
    # Имя файла бэкапа с датой и временем
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_filename = f'backup_{timestamp}.zip'
    backup_path = backups_dir / backup_filename
    
    print(f'Создание бэкапа: {backup_filename}')
    
    # Создаем ZIP архив
    with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        # Бэкап базы данных
        db_path = BASE_DIR / 'db.sqlite3'
        if db_path.exists():
            zipf.write(db_path, 'db.sqlite3')
            print(f'  ✓ База данных добавлена ({db_path.stat().st_size / 1024 / 1024:.2f} MB)')
        else:
            print('  ⚠ База данных не найдена')
        
        # Бэкап медиа файлов
        media_dir = BASE_DIR / 'media'
        if media_dir.exists():
            media_count = 0
            for root, dirs, files in os.walk(media_dir):
                for file in files:
                    file_path = Path(root) / file
                    arcname = file_path.relative_to(BASE_DIR)
                    zipf.write(file_path, arcname)
                    media_count += 1
            print(f'  ✓ Медиа файлы добавлены ({media_count} файлов)')
        else:
            print('  ⚠ Папка media не найдена')
    
    backup_size = backup_path.stat().st_size / 1024 / 1024
    print(f'\n✓ Бэкап создан: {backup_path}')
    print(f'  Размер: {backup_size:.2f} MB')
    
    # Удаляем старые бэкапы (оставляем последние 30)
    cleanup_old_backups(backups_dir, keep_count=30)
    
    return backup_path

def cleanup_old_backups(backups_dir, keep_count=30):
    """Удаляет старые бэкапы, оставляя только последние N."""
    backups = sorted(backups_dir.glob('backup_*.zip'), key=os.path.getmtime, reverse=True)
    
    if len(backups) > keep_count:
        deleted_count = 0
        for backup in backups[keep_count:]:
            backup.unlink()
            deleted_count += 1
        if deleted_count > 0:
            print(f'\n✓ Удалено старых бэкапов: {deleted_count}')

def restore_backup(backup_path):
    """Восстанавливает данные из бэкапа."""
    if not backup_path.exists():
        print(f'Ошибка: Бэкап не найден: {backup_path}')
        return False
    
    print(f'Восстановление из бэкапа: {backup_path}')
    
    # Создаем резервную копию текущей БД перед восстановлением
    db_path = BASE_DIR / 'db.sqlite3'
    if db_path.exists():
        backup_db_path = BASE_DIR / f'db.sqlite3.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
        shutil.copy2(db_path, backup_db_path)
        print(f'  ✓ Текущая БД сохранена как: {backup_db_path.name}')
    
    # Распаковываем бэкап
    with zipfile.ZipFile(backup_path, 'r') as zipf:
        zipf.extractall(BASE_DIR)
        print('  ✓ Данные восстановлены')
    
    print('\n✓ Восстановление завершено')
    return True

if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Управление бэкапами БД и медиа файлов')
    parser.add_argument('--restore', type=str, help='Путь к файлу бэкапа для восстановления')
    
    args = parser.parse_args()
    
    if args.restore:
        restore_backup(Path(args.restore))
    else:
        create_backup()

