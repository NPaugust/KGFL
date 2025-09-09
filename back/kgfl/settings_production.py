import os
from .settings import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

ALLOWED_HOSTS = ['avgustin.pythonanywhere.com', 'localhost', '127.0.0.1']

# Убираем пакеты для разработки из INSTALLED_APPS
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party apps (только необходимые для продакшена)
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    
    # Local apps
    'core',
    'clubs',
    'matches',
    'players',
    'referees',
    'management',
    'stats',
]

# Database для MySQL на PythonAnywhere
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.environ.get('DB_NAME', 'avgustin$kgfl'),
        'USER': os.environ.get('DB_USER', 'avgustin'),
        'PASSWORD': os.environ.get('DB_PASSWORD', ''),
        'HOST': os.environ.get('DB_HOST', 'avgustin.mysql.pythonanywhere-services.com'),
        'OPTIONS': {
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
            'charset': 'utf8mb4',
        },
    }
}

# Static files (CSS, JavaScript, Images) для PythonAnywhere
STATIC_URL = '/static/'
STATIC_ROOT = '/home/avgustin/kgfl/staticfiles/'

# Media files для PythonAnywhere  
MEDIA_URL = '/media/'
MEDIA_ROOT = '/home/avgustin/kgfl/media/'

# CORS settings для продакшена
CORS_ALLOWED_ORIGINS = [
    "https://kgfl.vercel.app",
    "https://kgfl-front.vercel.app",
    "https://vercel.app", 
    "http://localhost:3000",  # для локальной разработки
]

CORS_ALLOW_CREDENTIALS = True

# Security settings
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Cache settings для продакшена
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'cache_table',
    }
}

# Logging для продакшена
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': '/home/avgustin/kgfl/logs/django.log',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
}
