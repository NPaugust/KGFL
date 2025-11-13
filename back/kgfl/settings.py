"""
Django settings for KGFL project.
"""

import os
from pathlib import Path
from decouple import config, Csv
import logging


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-your-secret-key-here')

# По умолчанию DEBUG=True для локальной разработки (без .env файла)
# В продакшене нужно явно указать DEBUG=False в .env
DEBUG = config('DEBUG', default=True, cast=bool)

# ПРИНУДИТЕЛЬНО отключаем все HTTPS настройки при DEBUG=True
# Это должно быть ДО определения SecurityMiddleware и других настроек
if DEBUG:
    # Принудительно отключаем все HTTPS редиректы и заголовки
    SECURE_SSL_REDIRECT = False
    SECURE_HSTS_SECONDS = 0
    SECURE_HSTS_INCLUDE_SUBDOMAINS = False
    SECURE_HSTS_PRELOAD = False
    SECURE_PROXY_SSL_HEADER = None
    USE_X_FORWARDED_HOST = False
    # Удаляем из окружения чтобы config() не мог их перечитать
    os.environ.pop('SECURE_SSL_REDIRECT', None)
    os.environ.pop('SECURE_HSTS_SECONDS', None)
    os.environ.pop('SECURE_PROXY_SSL_HEADER', None)
else:
    # Продакшен - читаем из .env
    SECURE_SSL_REDIRECT = config('SECURE_SSL_REDIRECT', default=True, cast=bool)
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    USE_X_FORWARDED_HOST = True

# ALLOWED_HOSTS с автоматическим добавлением localhost для локальной разработки
_allowed_hosts_str = config(
    'ALLOWED_HOSTS',
    default='localhost,127.0.0.1,kyrgyzfl.kg,www.kyrgyzfl.kg',
    cast=lambda v: [s.strip() for s in v.split(',')]
)
ALLOWED_HOSTS = list(_allowed_hosts_str)

# Всегда добавляем localhost и 127.0.0.1 (для локальной разработки)
# Это безопасно, так как эти хосты работают только локально
if 'localhost' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('localhost')
if '127.0.0.1' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('127.0.0.1')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'django_extensions',
    
    # Local apps
    'core',
    'clubs',
    'matches',
    'players',
    'referees',
    'management',
    'stats',
]

MIDDLEWARE = [
    'django.middleware.cache.UpdateCacheMiddleware',
    'corsheaders.middleware.CorsMiddleware',
] + ([
    'django.middleware.security.SecurityMiddleware',
] if not DEBUG else []) + [
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.cache.FetchFromCacheMiddleware',
]

# Дополнительная проверка: убеждаемся что SecurityMiddleware не активен при DEBUG
if DEBUG and 'django.middleware.security.SecurityMiddleware' in MIDDLEWARE:
    MIDDLEWARE.remove('django.middleware.security.SecurityMiddleware')

# Включаем автоматическое добавление слэша (стандартное поведение Django)
APPEND_SLASH = True

ROOT_URLCONF = 'kgfl.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'kgfl.wsgi.application'

# Database
# Автоматическое определение: локально SQLite, продакшен PostgreSQL
DB_ENGINE = config('DB_ENGINE', default=None)
DB_NAME = config('DB_NAME', default=None)
DB_USER = config('DB_USER', default='')
DB_PASSWORD = config('DB_PASSWORD', default='')
DB_HOST = config('DB_HOST', default='localhost')
DB_PORT = config('DB_PORT', default='5432')

# Если не указан явно, определяем автоматически
if DB_ENGINE is None:
    # Если DEBUG=True (локальная разработка) или хост 'db' (Docker) недоступен - используем SQLite
    if DEBUG:
        DB_ENGINE = 'django.db.backends.sqlite3'
        DB_NAME = str(BASE_DIR / 'db.sqlite3')
    else:
        # Для продакшена пробуем PostgreSQL
        DB_ENGINE = 'django.db.backends.postgresql'
        DB_NAME = DB_NAME or 'kgfl_db'

# Если указан PostgreSQL, проверяем доступность с быстрым таймаутом
if DB_ENGINE == 'django.db.backends.postgresql':
    try:
        import socket
        # Быстрая проверка доступности хоста (таймаут 1 секунда)
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(1)
        result = sock.connect_ex((DB_HOST, int(DB_PORT)))
        sock.close()
        
        if result != 0:
            # Хост недоступен - используем SQLite
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f'PostgreSQL недоступен ({DB_HOST}:{DB_PORT}), используем SQLite для локальной разработки')
            DB_ENGINE = 'django.db.backends.sqlite3'
            DB_NAME = str(BASE_DIR / 'db.sqlite3')
    except Exception:
        # При любой ошибке используем SQLite
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f'Ошибка проверки PostgreSQL, используем SQLite')
        DB_ENGINE = 'django.db.backends.sqlite3'
        DB_NAME = str(BASE_DIR / 'db.sqlite3')

# Если все еще не определено, используем SQLite
if DB_ENGINE is None:
    DB_ENGINE = 'django.db.backends.sqlite3'
    DB_NAME = str(BASE_DIR / 'db.sqlite3')

DATABASES = {
    'default': {
        'ENGINE': DB_ENGINE,
        'NAME': DB_NAME,
        'USER': DB_USER if DB_ENGINE != 'django.db.backends.sqlite3' else '',
        'PASSWORD': DB_PASSWORD if DB_ENGINE != 'django.db.backends.sqlite3' else '',
        'HOST': DB_HOST if DB_ENGINE != 'django.db.backends.sqlite3' else '',
        'PORT': DB_PORT if DB_ENGINE != 'django.db.backends.sqlite3' else '',
    }
}

# Для SQLite убираем лишние параметры
if DB_ENGINE == 'django.db.backends.sqlite3':
    DATABASES['default'].pop('USER', None)
    DATABASES['default'].pop('PASSWORD', None)
    DATABASES['default'].pop('HOST', None)
    DATABASES['default'].pop('PORT', None)

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'Asia/Bishkek'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [
    BASE_DIR / 'static',
]

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_RENDERER_CLASSES': (
        'rest_framework.renderers.JSONRenderer',
    ),
    'DEFAULT_PARSER_CLASSES': (
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ),
}

# JWT settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': False,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUDIENCE': None,
    'ISSUER': None,
    'JWK_URL': None,
    'LEEWAY': 0,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'USER_AUTHENTICATION_RULE': 'rest_framework_simplejwt.authentication.default_user_authentication_rule',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    'JTI_CLAIM': 'jti',
    'SLIDING_TOKEN_REFRESH_EXP_CLAIM': 'refresh_exp',
    'SLIDING_TOKEN_LIFETIME': timedelta(minutes=5),
    'SLIDING_TOKEN_REFRESH_LIFETIME': timedelta(days=1),
}


CORS_ALLOWED_ORIGINS = config('CORS_ALLOWED_ORIGINS', default='http://localhost:3000,http://127.0.0.1:3000,https://kyrgyzfl.kg', cast=lambda v: [s.strip() for s in v.split(',')])

CORS_ALLOW_CREDENTIALS = True

CORS_ALLOW_ALL_ORIGINS = DEBUG

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Доверенные источники для CSRF (важно для продакшена за HTTPS/домен)
CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='https://kyrgyzfl.kg,https://www.kyrgyzfl.kg',
    cast=lambda v: [s.strip() for s in v.split(',') if s.strip()]
)

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG' if DEBUG else 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.request': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
        'rest_framework': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
os.makedirs(BASE_DIR / 'logs', exist_ok=True)

# Custom user model
AUTH_USER_MODEL = 'core.User'

# Admin site customization
ADMIN_SITE_HEADER = "KGFL Администрация"
ADMIN_SITE_TITLE = "KGFL Админ"
ADMIN_INDEX_TITLE = "Добро пожаловать в KGFL Админ"

# File upload settings
FILE_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 10 * 1024 * 1024  # 10MB

# Cache settings - поддерживает Redis и LocMemCache
CACHE_BACKEND = config('CACHE_BACKEND', default='locmem')  # 'redis' или 'locmem'

if CACHE_BACKEND == 'redis':
    # Redis кэш для продакшена
    try:
        REDIS_HOST = config('REDIS_HOST', default='localhost')
        REDIS_PORT = config('REDIS_PORT', default='6379', cast=int)
        REDIS_DB = config('REDIS_DB', default=0, cast=int)
        
        CACHES = {
            'default': {
                'BACKEND': 'django_redis.cache.RedisCache',
                'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}',
                'OPTIONS': {
                    'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                    'SOCKET_CONNECT_TIMEOUT': 5,
                    'SOCKET_TIMEOUT': 5,
                    'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
                    'IGNORE_EXCEPTIONS': True,  # Игнорируем ошибки Redis - fallback на LocMemCache
                },
                'KEY_PREFIX': 'kgfl',
                'TIMEOUT': 300,  # 5 minutes
            }
        }
    except Exception:
        # Если Redis недоступен, используем LocMemCache
        CACHE_BACKEND = 'locmem'

if CACHE_BACKEND == 'locmem':
    # LocMemCache для разработки (fallback или по умолчанию)
    CACHES = {
        'default': {
            'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
            'LOCATION': 'unique-snowflake',
            'TIMEOUT': 300,  # 5 minutes
            'OPTIONS': {
                'MAX_ENTRIES': 1000,
            }
        }
    }

# Cache settings for views
CACHE_MIDDLEWARE_ALIAS = 'default'
CACHE_MIDDLEWARE_SECONDS = 300  # 5 minutes
CACHE_MIDDLEWARE_KEY_PREFIX = 'kgfl'

# Session/Security settings
SESSION_COOKIE_AGE = 3600  # 1 hour
# Явно отключаем SECURE для cookies при DEBUG, чтобы работало через HTTP
if DEBUG:
    SESSION_COOKIE_SECURE = False
    CSRF_COOKIE_SECURE = False
else:
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'

# Дополнительные security заголовки (определяются выше при DEBUG)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Media serving in development
SERVE_MEDIA = config('SERVE_MEDIA', default=True, cast=bool)

# Sentry для мониторинга ошибок (опционально)
SENTRY_DSN = config('SENTRY_DSN', default=None)
if SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.django import DjangoIntegration
        from sentry_sdk.integrations.logging import LoggingIntegration
        
        sentry_sdk.init(
            dsn=SENTRY_DSN,
            integrations=[
                DjangoIntegration(),
                LoggingIntegration(
                    level=logging.INFO,
                    event_level=logging.ERROR
                ),
            ],
            traces_sample_rate=0.1 if DEBUG else 0.05,  # 10% в dev, 5% в prod
            send_default_pii=False,  # Не отправлять персональные данные
            environment='development' if DEBUG else 'production',
        )
    except ImportError:
        # Если sentry-sdk не установлен, просто пропускаем
        pass

# DRF Spectacular для API документации (опционально)
USE_API_DOCS = config('USE_API_DOCS', default=False, cast=bool)
if USE_API_DOCS:
    try:
        INSTALLED_APPS.append('drf_spectacular')
        
        REST_FRAMEWORK['DEFAULT_SCHEMA_CLASS'] = 'drf_spectacular.openapi.AutoSchema'
        
        SPECTACULAR_SETTINGS = {
            'TITLE': 'KGFL API',
            'DESCRIPTION': 'API для Кыргызской футбольной лиги',
            'VERSION': '1.0.0',
            'SERVE_INCLUDE_SCHEMA': False,
            'COMPONENT_SPLIT_REQUEST': True,
        }
    except ImportError:
        # Если drf-spectacular не установлен, отключаем документацию
        USE_API_DOCS = False 