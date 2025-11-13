# Инструкция по деплою на kyrgyzfl.kg

## Подготовка к деплою

# Команды для деплоя.


# 1. Получить изменения из Git
git pull origin main

# 2. Остановить контейнеры
docker-compose down

# 3. Пересобрать образы
docker-compose build --no-cache

# 4. Применить миграции
docker-compose run --rm backend python manage.py migrate

# 5. Собрать статические файлы
docker-compose run --rm backend python manage.py collectstatic --noinput

# 6. Запустить контейнеры
docker-compose up -d

# 7. Проверить логи
docker-compose logs -f








### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd KGFL
```

### 2. Настройка переменных окружения

#### Backend (.env файл в папке `back/`)

Создайте файл `back/.env` со следующим содержимым:

```env
# Django
SECRET_KEY=ваш-секретный-ключ-для-продакшена
DEBUG=False
ALLOWED_HOSTS=kyrgyzfl.kg,www.kyrgyzfl.kg,localhost,127.0.0.1

# Database (PostgreSQL)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kgfl_db
DB_USER=kgfl_user
DB_PASSWORD=ваш-пароль-от-бд
DB_HOST=db
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=https://kyrgyzfl.kg,https://www.kyrgyzfl.kg

# Security
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True

# Media/Serve
SERVE_MEDIA=False
```

#### Frontend (.env.production файл в папке `front/`)

Создайте файл `front/.env.production` со следующим содержимым:

```env
NEXT_PUBLIC_API_URL=https://kyrgyzfl.kg/api
NEXT_PUBLIC_MEDIA_HOST=kyrgyzfl.kg
NODE_ENV=production
```

### 3. Docker Compose деплой

#### Шаг 1: Остановите существующие контейнеры (если есть)

```bash
docker-compose down
```

#### Шаг 2: Соберите образы

```bash
docker-compose build --no-cache
```

#### Шаг 3: Запустите миграции и соберите статические файлы

```bash
docker-compose run --rm backend python manage.py migrate
docker-compose run --rm backend python manage.py collectstatic --noinput
```

#### Шаг 4: Создайте суперпользователя (если нужно)

```bash
docker-compose run --rm backend python manage.py createsuperuser
```

#### Шаг 5: Запустите контейнеры

```bash
docker-compose up -d
```

#### Шаг 6: Проверьте логи

```bash
docker-compose logs -f
```

### 4. Настройка Nginx

Создайте файл конфигурации Nginx (например, `/etc/nginx/sites-available/kyrgyzfl.kg`):

```nginx
upstream backend {
    server 127.0.0.1:8000;
}

upstream frontend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name kyrgyzfl.kg www.kyrgyzfl.kg;
    
    # Редирект на HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name kyrgyzfl.kg www.kyrgyzfl.kg;

    ssl_certificate /etc/ssl/certs/kyrgyzfl.kg.crt;
    ssl_certificate_key /etc/ssl/private/kyrgyzfl.kg.key;

    # SSL настройки
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Логи
    access_log /var/log/nginx/kyrgyzfl_access.log;
    error_log /var/log/nginx/kyrgyzfl_error.log;

    # Максимальный размер загружаемых файлов
    client_max_body_size 50M;

    # Frontend (Next.js)
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
    }

    # Media файлы (если используется Nginx для раздачи)
    location /media {
        alias /путь/к/проекту/data/media;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Static файлы
    location /static {
        alias /путь/к/проекту/data/static;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

Активируйте конфигурацию:

```bash
sudo ln -s /etc/nginx/sites-available/kyrgyzfl.kg /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Автоматический деплой через Git Pull

Создайте скрипт для автоматического деплоя (например, `deploy.sh`):

```bash
#!/bin/bash

echo "Начинаем деплой..."

# Переходим в директорию проекта
cd /путь/к/проекту

# Получаем последние изменения
git pull origin main

# Пересобираем и перезапускаем контейнеры
docker-compose down
docker-compose build --no-cache
docker-compose run --rm backend python manage.py migrate
docker-compose run --rm backend python manage.py collectstatic --noinput
docker-compose up -d

echo "Деплой завершен!"
```

Сделайте скрипт исполняемым:

```bash
chmod +x deploy.sh
```

### 6. Автоматические бэкапы

Настройте cron для автоматических бэкапов (ежедневно в 2:00):

```bash
crontab -e
```

Добавьте строку:

```cron
0 2 * * * cd /путь/к/проекту/back && docker-compose exec -T backend python manage.py backup
```

### 7. Проверка работоспособности

После деплоя проверьте:

1. **Frontend**: https://kyrgyzfl.kg
2. **API**: https://kyrgyzfl.kg/api/
3. **Admin панель**: https://kyrgyzfl.kg/admin
4. **Статические файлы**: https://kyrgyzfl.kg/static/
5. **Медиа файлы**: https://kyrgyzfl.kg/media/

### 8. Мониторинг

Проверяйте логи:

```bash
# Логи всех сервисов
docker-compose logs -f

# Логи backend
docker-compose logs -f backend

# Логи frontend
docker-compose logs -f frontend

# Логи Django
docker-compose exec backend tail -f logs/django.log
```

### 9. Обновление сезонов

Настройте cron для автоматического обновления статуса сезонов:

```cron
0 0 * * * cd /путь/к/проекту/back && docker-compose exec -T backend python manage.py update_seasons
```

## Важные замечания

1. **SECRET_KEY**: Используйте уникальный секретный ключ для продакшена! Никогда не коммитьте его в Git.
2. **Пароли БД**: Используйте надежные пароли в продакшене.
3. **SSL сертификаты**: Убедитесь, что SSL сертификаты настроены правильно.
4. **Бэкапы**: Регулярно проверяйте, что бэкапы создаются успешно.
5. **Логи**: Мониторьте логи на наличие ошибок.

## Быстрый деплой одной командой

```bash
cd /путь/к/проекту && git pull && docker-compose down && docker-compose build --no-cache && docker-compose run --rm backend python manage.py migrate && docker-compose run --rm backend python manage.py collectstatic --noinput && docker-compose up -d
```

