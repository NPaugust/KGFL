# Инструкция по настройке автоматических бэкапов

## Что бэкапится:
- База данных (PostgreSQL или SQLite - определяется автоматически)
- Все медиа файлы (логотипы клубов, фото игроков, документы и т.д.)

## Поддерживаемые БД:
- **PostgreSQL** - используется `pg_dump` для создания дампа
- **SQLite** - копируется файл БД

## Требования для PostgreSQL:
- Установленный PostgreSQL client tools (`pg_dump`, `pg_restore`, `psql`)
- Доступ к БД с правами на создание дампа

## Создание бэкапа вручную:

### Windows (с активированным виртуальным окружением):
```bash
cd back
venv\Scripts\activate
python manage.py backup
```

### Linux/Mac (с активированным виртуальным окружением):
```bash
cd back
source venv/bin/activate
python manage.py backup
```

Бэкапы сохраняются в папку `back/backups/` с именем `backup_YYYYMMDD_HHMMSS.zip`

## Восстановление из бэкапа:

```bash
python manage.py backup --restore backups/backup_20241105_120000.zip
```

⚠️ **ВНИМАНИЕ**: Восстановление перезапишет текущую БД и медиа файлы! Перед восстановлением создается резервная копия текущих данных.

## Настройка автоматических бэкапов:

### Windows (Task Scheduler):

1. Откройте "Планировщик заданий" (Task Scheduler)
2. Создайте новое задание:
   - **Триггер**: Ежедневно в 2:00 ночи
   - **Действие**: Запуск программы
   - **Программа**: `F:\futbol\KGFL\back\venv\Scripts\python.exe`
   - **Аргументы**: `manage.py backup`
   - **Рабочая папка**: `F:\futbol\KGFL\back`
   - Или используйте `backup.bat` файл (нужно обновить пути в нём)

### Linux (Cron):

1. Откройте crontab:
```bash
crontab -e
```

2. Добавьте строку для ежедневного бэкапа в 2:00 ночи:
```bash
0 2 * * * cd /path/to/KGFL/back && /path/to/venv/bin/python manage.py backup >> /var/log/kgfl_backup.log 2>&1
```

3. Сделайте скрипт исполняемым:
```bash
chmod +x back/backup.sh
```

### Рекомендации:

1. **Хранение бэкапов**: 
   - Локально хранятся последние 30 бэкапов (автоматически удаляются старые)
   - Рекомендуется копировать бэкапы на внешний диск или облако (Google Drive, Dropbox, Yandex Disk)

2. **Частота бэкапов**:
   - Ежедневно - для активного использования
   - Еженедельно - если проект не очень активный

3. **Проверка бэкапов**:
   - Периодически проверяйте, что бэкапы создаются
   - Раз в месяц тестируйте восстановление из бэкапа

4. **Дополнительная защита**:
   - Можно настроить отправку бэкапов на email (если размер позволяет)
   - Или автоматическую загрузку в облачное хранилище

## Структура бэкапа:

### PostgreSQL:
```
backup_20241105_120000.zip
├── db_dump_20241105_120000.sql  # Дамп PostgreSQL
└── media/                        # Медиа файлы
    ├── clubs/
    ├── players/
    ├── management/
    └── ...
```

### SQLite:
```
backup_20241105_120000.zip
├── db.sqlite3                   # База данных SQLite
└── media/                       # Медиа файлы
    ├── clubs/
    ├── players/
    ├── management/
    └── ...
```

## Мониторинг:

Проверить последние бэкапы:
```bash
# Windows
dir back\backups\backup_*.zip /O-D

# Linux/Mac
ls -lt back/backups/backup_*.zip
```

## Параметры команды:

- `python manage.py backup` - создать бэкап
- `python manage.py backup --restore path/to/backup.zip` - восстановить из бэкапа
- `python manage.py backup --keep 50` - хранить последние 50 бэкапов (по умолчанию 30)

## Установка PostgreSQL client tools:

### Windows:
Скачайте и установите PostgreSQL с официального сайта: https://www.postgresql.org/download/windows/
Или используйте только клиентские инструменты: https://www.postgresql.org/download/windows/

### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install postgresql-client
```

### Linux (CentOS/RHEL):
```bash
sudo yum install postgresql
```

### Mac:
```bash
brew install postgresql
```

