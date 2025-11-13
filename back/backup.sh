#!/bin/bash
# Скрипт для Linux cron
# Создает бэкап базы данных и медиа файлов

cd "$(dirname "$0")"
source venv/bin/activate
python manage.py backup

# Можно добавить отправку бэкапа на email или облако
# Например, загрузка в Google Drive через rclone или отправка на FTP


