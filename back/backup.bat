@echo off
REM Скрипт для Windows Task Scheduler
REM Создает бэкап базы данных и медиа файлов

cd /d "%~dp0"
call venv\Scripts\activate.bat
python manage.py backup

REM Можно добавить отправку бэкапа на email или облако
REM Например, загрузка в Google Drive через rclone или отправка на FTP


