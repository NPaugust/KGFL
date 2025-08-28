# KGFL Backend (Django)

Бэкенд для официального сайта Кыргызской футбольной лиги (KGFL).

## 🚀 Технологии

- **Django 5.0** - Веб-фреймворк Python
- **Django REST Framework** - API фреймворк
- **Django Simple JWT** - JWT аутентификация
- **PostgreSQL** - База данных (SQLite для разработки)
- **Pillow** - Обработка изображений
- **Celery** - Асинхронные задачи
- **Redis** - Кэширование и очереди

## 📁 Структура проекта

```
back/
├── kgfl/                    # Основной проект Django
│   ├── __init__.py
│   ├── settings.py         # Настройки проекта
│   ├── urls.py             # Основные URL маршруты
│   ├── wsgi.py             # WSGI конфигурация
│   └── asgi.py             # ASGI конфигурация
├── core/                   # Основное приложение
│   ├── models.py           # Пользователи, сезоны, партнеры, новости
│   ├── serializers.py      # Сериализаторы
│   ├── views.py            # API представления
│   ├── urls.py             # URL маршруты
│   └── admin.py            # Админ-панель
├── clubs/                  # Приложение клубов
│   ├── models.py           # Клубы, тренеры, статистика
│   ├── serializers.py      # Сериализаторы
│   ├── views.py            # API представления
│   ├── urls.py             # URL маршруты
│   └── admin.py            # Админ-панель
├── matches/                # Приложение матчей
│   ├── models.py           # Матчи, голы, карточки, замены
│   ├── serializers.py      # Сериализаторы
│   ├── views.py            # API представления
│   ├── urls.py             # URL маршруты
│   └── admin.py            # Админ-панель
├── players/                # Приложение игроков
│   ├── models.py           # Игроки, статистика
│   ├── serializers.py      # Сериализаторы
│   ├── views.py            # API представления
│   ├── urls.py             # URL маршруты
│   └── admin.py            # Админ-панель
├── referees/               # Приложение судей
├── management/             # Приложение руководства
├── stats/                  # Приложение статистики
├── requirements.txt        # Зависимости Python
├── manage.py              # Django management
├── setup.py               # Скрипт настройки
└── README.md              # Документация
```

## 🛠 Установка и запуск

### Требования
- Python 3.9+
- pip
- virtualenv (рекомендуется)

### Установка зависимостей
```bash
# Создание виртуального окружения
python -m venv venv

# Активация виртуального окружения
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Установка зависимостей
pip install -r requirements.txt
```

### Настройка проекта
```bash
# Автоматическая настройка (создание миграций, суперпользователя, тестовых данных)
python setup.py

# Или вручную:
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
```

### Запуск сервера разработки
```bash
python manage.py runserver
```

Сервер будет доступен по адресу: http://localhost:8000

## 🔗 API Endpoints

### Аутентификация
- `POST /api/token/` - Получение JWT токена
- `POST /api/token/refresh/` - Обновление токена
- `POST /api/token/verify/` - Проверка токена

### Пользователи
- `GET /api/users/` - Список пользователей
- `POST /api/users/` - Создание пользователя
- `GET /api/users/profile/` - Профиль текущего пользователя
- `PUT /api/users/update_profile/` - Обновление профиля
- `POST /api/users/login/` - Вход в систему

### Сезоны
- `GET /api/seasons/` - Список сезонов
- `GET /api/seasons/active/` - Активный сезон

### Клубы
- `GET /api/clubs/` - Список клубов
- `GET /api/clubs/{id}/` - Детали клуба
- `GET /api/clubs/search/` - Поиск клубов
- `GET /api/clubs/{id}/players/` - Игроки клуба
- `GET /api/clubs/{id}/matches/` - Матчи клуба

### Турнирная таблица
- `GET /api/clubs/seasons/table/` - Турнирная таблица
- `GET /api/clubs/seasons/by_season/` - Статистика по сезону

### Матчи
- `GET /api/matches/` - Список матчей
- `GET /api/matches/{id}/` - Детали матча
- `GET /api/matches/upcoming/` - Ближайшие матчи
- `GET /api/matches/latest/` - Последние матчи

### Игроки
- `GET /api/players/` - Список игроков
- `GET /api/players/{id}/` - Детали игрока
- `GET /api/players/top_scorers/` - Лучшие бомбардиры

### Судьи
- `GET /api/referees/` - Список судей

### Руководство
- `GET /api/management/` - Список руководителей

### Статистика
- `GET /api/stats/` - Общая статистика

### Партнеры
- `GET /api/partners/` - Список партнеров
- `GET /api/partners/by_category/` - Партнеры по категории

### Новости
- `GET /api/news/` - Список новостей
- `GET /api/news/{id}/` - Детали новости
- `GET /api/news/search/` - Поиск новостей
- `GET /api/news/latest/` - Последние новости

## 🔐 Аутентификация и права доступа

### Роли пользователей
- **admin** - Полный доступ ко всем функциям
- **moderator** - Модерация контента
- **editor** - Редактирование данных
- **viewer** - Только просмотр

### JWT токены
- Access Token: 1 час
- Refresh Token: 7 дней

## 📊 Модели данных

### Core
- **User** - Пользователи системы
- **Season** - Сезоны лиги
- **Partner** - Партнеры лиги
- **News** - Новости

### Clubs
- **Club** - Футбольные клубы
- **Coach** - Тренеры
- **ClubSeason** - Статистика клубов в сезонах

### Matches
- **Match** - Матчи
- **Goal** - Голы
- **Card** - Карточки
- **Substitution** - Замены

### Players
- **Player** - Игроки
- **PlayerStats** - Статистика игроков

### Management
- **Manager** - Руководители лиги

## 🎯 Функциональность

### Для администраторов
- Управление пользователями
- Создание/редактирование клубов
- Управление матчами и результатами
- Добавление игроков и статистики
- Управление новостями
- Настройка сезонов

### Для модераторов
- Редактирование данных клубов
- Обновление результатов матчей
- Модерация новостей

### Для редакторов
- Добавление игроков
- Ввод статистики
- Создание новостей

### Для пользователей
- Просмотр турнирной таблицы
- Просмотр матчей и результатов
- Просмотр статистики игроков
- Чтение новостей

## 🔧 Команды управления

```bash
# Создание миграций
python manage.py makemigrations

# Применение миграций
python manage.py migrate

# Создание суперпользователя
python manage.py createsuperuser

# Сбор статических файлов
python manage.py collectstatic

# Создание резервной копии
python manage.py dumpdata > backup.json

# Восстановление из резервной копии
python manage.py loaddata backup.json

# Запуск тестов
python manage.py test

# Проверка кода
python manage.py check
```

## 📝 Переменные окружения

Создайте файл `.env` в корне проекта:

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=sqlite:///db.sqlite3

# JWT
JWT_SECRET_KEY=your-jwt-secret-key

# Media files
MEDIA_URL=/media/
MEDIA_ROOT=media/

# Static files
STATIC_URL=/static/
STATIC_ROOT=staticfiles/
```

## 🚀 Развертывание

### Production настройки
1. Измените `DEBUG = False` в settings.py
2. Настройте PostgreSQL базу данных
3. Настройте Redis для кэширования
4. Настройте Celery для фоновых задач
5. Настройте веб-сервер (Nginx + Gunicorn)

### Docker (опционально)
```bash
# Сборка образа
docker build -t kgfl-backend .

# Запуск контейнера
docker run -p 8000:8000 kgfl-backend
```

## 📈 Мониторинг и логирование

- Логи сохраняются в `logs/django.log`
- Настройки логирования в `settings.py`
- Возможность интеграции с Sentry для отслеживания ошибок

## 🔒 Безопасность

- JWT аутентификация
- CORS настройки для фронтенда
- Валидация данных через сериализаторы
- Права доступа на уровне представлений
- Защита от CSRF атак

## 🧪 Тестирование

```bash
# Запуск всех тестов
python manage.py test

# Запуск тестов с покрытием
coverage run --source='.' manage.py test
coverage report
coverage html
```

## 📚 Документация API

После запуска сервера документация API доступна по адресу:
- http://localhost:8000/api/ (DRF browsable API)

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch (`git checkout -b feature/amazing-feature`)
3. Commit изменения (`git commit -m 'Add amazing feature'`)
4. Push в branch (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект является частной собственностью KGFL.