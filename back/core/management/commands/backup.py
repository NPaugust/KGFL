from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import connection
import os
import shutil
import zipfile
import subprocess
from datetime import datetime
from pathlib import Path


class Command(BaseCommand):
    help = 'Создает бэкап базы данных и медиа файлов'

    def add_arguments(self, parser):
        parser.add_argument(
            '--restore',
            type=str,
            help='Путь к файлу бэкапа для восстановления',
        )
        parser.add_argument(
            '--keep',
            type=int,
            default=30,
            help='Количество бэкапов для хранения (по умолчанию 30)',
        )

    def handle(self, *args, **options):
        if options['restore']:
            self.restore_backup(Path(options['restore']))
        else:
            self.create_backup(options['keep'])

    def create_backup(self, keep_count=30):
        """Создает бэкап базы данных и медиа файлов."""
        BASE_DIR = Path(settings.BASE_DIR)
        
        # Создаем папку для бэкапов если её нет
        backups_dir = BASE_DIR / 'backups'
        backups_dir.mkdir(exist_ok=True)
        
        # Имя файла бэкапа с датой и временем
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'backup_{timestamp}.zip'
        backup_path = backups_dir / backup_filename
        
        self.stdout.write(f'Создание бэкапа: {backup_filename}')
        
        # Определяем тип БД
        db_engine = settings.DATABASES['default']['ENGINE']
        is_postgresql = 'postgresql' in db_engine or 'psycopg' in db_engine
        is_sqlite = 'sqlite' in db_engine
        
        # Создаем ZIP архив
        with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            # Бэкап базы данных
            if is_postgresql:
                # PostgreSQL бэкап через pg_dump
                db_name = settings.DATABASES['default']['NAME']
                db_user = settings.DATABASES['default']['USER']
                db_host = settings.DATABASES['default']['HOST']
                db_port = settings.DATABASES['default']['PORT']
                db_password = settings.DATABASES['default']['PASSWORD']
                
                dump_filename = f'db_dump_{timestamp}.sql'
                dump_path = backups_dir / dump_filename
                
                try:
                    # Устанавливаем переменную окружения для пароля
                    env = os.environ.copy()
                    if db_password:
                        env['PGPASSWORD'] = db_password
                    
                    # Создаем дамп PostgreSQL
                    cmd = [
                        'pg_dump',
                        '-h', db_host or 'localhost',
                        '-p', str(db_port or '5432'),
                        '-U', db_user or 'postgres',
                        '-d', db_name,
                        '-F', 'c',  # Custom format (сжатый)
                        '-f', str(dump_path)
                    ]
                    
                    result = subprocess.run(cmd, env=env, capture_output=True, text=True)
                    
                    if result.returncode == 0:
                        zipf.write(dump_path, dump_filename)
                        db_size = dump_path.stat().st_size / 1024 / 1024
                        self.stdout.write(self.style.SUCCESS(f'  ✓ База данных PostgreSQL добавлена ({db_size:.2f} MB)'))
                        # Удаляем временный файл дампа
                        dump_path.unlink()
                    else:
                        # Пробуем текстовый формат если custom не работает
                        cmd[-2] = 'p'  # Plain text format
                        cmd[-1] = str(dump_path)
                        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
                        
                        if result.returncode == 0:
                            zipf.write(dump_path, dump_filename)
                            db_size = dump_path.stat().st_size / 1024 / 1024
                            self.stdout.write(self.style.SUCCESS(f'  ✓ База данных PostgreSQL добавлена ({db_size:.2f} MB)'))
                            dump_path.unlink()
                        else:
                            self.stdout.write(self.style.ERROR(f'  ✗ Ошибка создания дампа PostgreSQL: {result.stderr}'))
                            self.stdout.write(self.style.WARNING('  ⚠ Убедитесь, что pg_dump установлен и доступен в PATH'))
                            
                except FileNotFoundError:
                    self.stdout.write(self.style.ERROR('  ✗ pg_dump не найден. Установите PostgreSQL client tools.'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'  ✗ Ошибка при создании дампа: {str(e)}'))
                    
            elif is_sqlite:
                # SQLite бэкап
                db_path = BASE_DIR / settings.DATABASES['default']['NAME']
                if db_path.exists():
                    zipf.write(db_path, 'db.sqlite3')
                    db_size = db_path.stat().st_size / 1024 / 1024
                    self.stdout.write(self.style.SUCCESS(f'  ✓ База данных SQLite добавлена ({db_size:.2f} MB)'))
                else:
                    self.stdout.write(self.style.WARNING('  ⚠ База данных SQLite не найдена'))
            else:
                self.stdout.write(self.style.WARNING(f'  ⚠ Неподдерживаемый тип БД: {db_engine}'))
            
            # Бэкап медиа файлов
            media_dir = BASE_DIR / 'media'
            if media_dir.exists():
                media_count = 0
                total_size = 0
                for root, dirs, files in os.walk(media_dir):
                    for file in files:
                        file_path = Path(root) / file
                        arcname = file_path.relative_to(BASE_DIR)
                        zipf.write(file_path, arcname)
                        media_count += 1
                        total_size += file_path.stat().st_size
                media_size_mb = total_size / 1024 / 1024
                self.stdout.write(self.style.SUCCESS(f'  ✓ Медиа файлы добавлены ({media_count} файлов, {media_size_mb:.2f} MB)'))
            else:
                self.stdout.write(self.style.WARNING('  ⚠ Папка media не найдена'))
        
        backup_size = backup_path.stat().st_size / 1024 / 1024
        self.stdout.write(self.style.SUCCESS(f'\n✓ Бэкап создан: {backup_path}'))
        self.stdout.write(self.style.SUCCESS(f'  Размер: {backup_size:.2f} MB'))
        
        # Удаляем старые бэкапы
        self.cleanup_old_backups(backups_dir, keep_count)
        
        return backup_path

    def cleanup_old_backups(self, backups_dir, keep_count=30):
        """Удаляет старые бэкапы, оставляя только последние N."""
        backups = sorted(backups_dir.glob('backup_*.zip'), key=os.path.getmtime, reverse=True)
        
        if len(backups) > keep_count:
            deleted_count = 0
            for backup in backups[keep_count:]:
                backup.unlink()
                deleted_count += 1
            if deleted_count > 0:
                self.stdout.write(self.style.SUCCESS(f'\n✓ Удалено старых бэкапов: {deleted_count}'))

    def restore_backup(self, backup_path):
        """Восстанавливает данные из бэкапа."""
        if not backup_path.exists():
            self.stdout.write(self.style.ERROR(f'Ошибка: Бэкап не найден: {backup_path}'))
            return False
        
        BASE_DIR = Path(settings.BASE_DIR)
        
        self.stdout.write(f'Восстановление из бэкапа: {backup_path}')
        
        # Определяем тип БД
        db_engine = settings.DATABASES['default']['ENGINE']
        is_postgresql = 'postgresql' in db_engine or 'psycopg' in db_engine
        is_sqlite = 'sqlite' in db_engine
        
        # Распаковываем бэкап во временную папку
        temp_dir = BASE_DIR / 'temp_restore'
        temp_dir.mkdir(exist_ok=True)
        
        try:
            with zipfile.ZipFile(backup_path, 'r') as zipf:
                zipf.extractall(temp_dir)
            
            # Восстанавливаем БД
            if is_postgresql:
                # Ищем файл дампа
                dump_files = list(temp_dir.glob('db_dump_*.sql'))
                if dump_files:
                    dump_file = dump_files[0]
                    db_name = settings.DATABASES['default']['NAME']
                    db_user = settings.DATABASES['default']['USER']
                    db_host = settings.DATABASES['default']['HOST']
                    db_port = settings.DATABASES['default']['PORT']
                    db_password = settings.DATABASES['default']['PASSWORD']
                    
                    env = os.environ.copy()
                    if db_password:
                        env['PGPASSWORD'] = db_password
                    
                    # Проверяем формат файла (custom или plain)
                    is_custom = dump_file.suffix == '.sql' and dump_file.stat().st_size > 0
                    
                    try:
                        if is_custom:
                            # Custom format
                            cmd = [
                                'pg_restore',
                                '-h', db_host or 'localhost',
                                '-p', str(db_port or '5432'),
                                '-U', db_user or 'postgres',
                                '-d', db_name,
                                '--clean',  # Очистить перед восстановлением
                                '--if-exists',
                                str(dump_file)
                            ]
                        else:
                            # Plain text format
                            cmd = [
                                'psql',
                                '-h', db_host or 'localhost',
                                '-p', str(db_port or '5432'),
                                '-U', db_user or 'postgres',
                                '-d', db_name,
                                '-f', str(dump_file)
                            ]
                        
                        result = subprocess.run(cmd, env=env, capture_output=True, text=True)
                        
                        if result.returncode == 0:
                            self.stdout.write(self.style.SUCCESS('  ✓ База данных PostgreSQL восстановлена'))
                        else:
                            self.stdout.write(self.style.ERROR(f'  ✗ Ошибка восстановления: {result.stderr}'))
                            return False
                    except FileNotFoundError:
                        self.stdout.write(self.style.ERROR('  ✗ pg_restore/psql не найден. Установите PostgreSQL client tools.'))
                        return False
                else:
                    self.stdout.write(self.style.ERROR('  ✗ Файл дампа БД не найден в бэкапе'))
                    return False
                    
            elif is_sqlite:
                # Создаем резервную копию текущей БД перед восстановлением
                db_path = BASE_DIR / settings.DATABASES['default']['NAME']
                if db_path.exists():
                    backup_db_path = BASE_DIR / f'db.sqlite3.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
                    shutil.copy2(db_path, backup_db_path)
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Текущая БД сохранена как: {backup_db_path.name}'))
                
                # Восстанавливаем SQLite
                db_backup = temp_dir / 'db.sqlite3'
                if db_backup.exists():
                    shutil.copy2(db_backup, db_path)
                    self.stdout.write(self.style.SUCCESS('  ✓ База данных SQLite восстановлена'))
                else:
                    self.stdout.write(self.style.ERROR('  ✗ Файл db.sqlite3 не найден в бэкапе'))
                    return False
            
            # Восстанавливаем медиа файлы
            media_backup = temp_dir / 'media'
            if media_backup.exists():
                media_dir = BASE_DIR / 'media'
                if media_dir.exists():
                    # Создаем резервную копию текущих медиа
                    media_backup_dir = BASE_DIR / f'media_backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}'
                    shutil.copytree(media_dir, media_backup_dir)
                    self.stdout.write(self.style.SUCCESS(f'  ✓ Текущие медиа сохранены в: {media_backup_dir.name}'))
                
                # Удаляем старые медиа и копируем новые
                if media_dir.exists():
                    shutil.rmtree(media_dir)
                shutil.copytree(media_backup, media_dir)
                self.stdout.write(self.style.SUCCESS('  ✓ Медиа файлы восстановлены'))
            
            self.stdout.write(self.style.SUCCESS('\n✓ Восстановление завершено'))
            return True
            
        finally:
            # Удаляем временную папку
            if temp_dir.exists():
                shutil.rmtree(temp_dir)


