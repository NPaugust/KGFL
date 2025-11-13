# Локальная разработка

Для локальной разработки рекомендуется использовать SQLite вместо PostgreSQL.

## Настройка .env

Создайте файл `back/.env` со следующим содержимым:

```env
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:8000
CSRF_TRUSTED_ORIGINS=http://localhost:3000,http://127.0.0.1:8000
SECURE_SSL_REDIRECT=False
```

## Запуск

### Вариант 1: Стандартный сервер (HTTP)

```bash
python manage.py runserver
```

Сервер будет доступен по адресу `http://127.0.0.1:8000/`

**⚠️ Если браузер принудительно переводит на HTTPS:**

Это проблема браузера (HSTS кэш), а не Django. Решения:

1. **Очистите HSTS в браузере:**
   - Chrome/Edge: Откройте `chrome://net-internals/#hsts`
   - В поле "Delete domain security policies" введите `127.0.0.1` и нажмите "Delete"
   - Повторите для `localhost`
   - Firefox: Очистите историю с опцией "Удалить все cookie и данные сайтов"

2. **Используйте другой порт:**
   ```bash
   python manage.py runserver 8001
   ```
   Затем откройте `http://127.0.0.1:8001/admin/`

3. **Используйте другой браузер** или режим инкогнито

### Вариант 2: Сервер с HTTPS поддержкой (для тестирования HTTPS локально)

Если вам нужен HTTPS для локальной разработки:

```bash
# Установите django-extensions если еще не установлено
pip install django-extensions

# Запустите сервер с HTTPS
python manage.py runserver_plus --cert-file cert.pem --key-file key.pem
```

Сервер будет доступен по адресу `https://127.0.0.1:8000/`

**Примечание:** При первом запуске сервер автоматически создаст самоподписанный сертификат. Браузер покажет предупреждение о безопасности - это нормально для локальной разработки.

## Проверка настроек

Для проверки что все настройки безопасности отключены:

```bash
python test_settings.py
```

## База данных

**Для локальной разработки:**
```env
# Локальная разработка - используем SQLite
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# Или просто не указывайте DB_ENGINE - по умолчанию будет SQLite
```

**Для продакшена** на kyrgyzfl.kg в `.env` укажите PostgreSQL:
```env
# Продакшен - PostgreSQL
DB_ENGINE=django.db.backends.postgresql
DB_NAME=kgfl_db
DB_USER=kgfl_user
DB_PASSWORD=ваш-пароль
DB_HOST=db
DB_PORT=5432
```

Проект автоматически определяет тип БД из настроек и работает корректно!
