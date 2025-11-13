"""
Тест для проверки настроек безопасности
Запустите: python test_settings.py
"""

import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kgfl.settings')
django.setup()

from django.conf import settings

print("=" * 60)
print("ПРОВЕРКА НАСТРОЕК БЕЗОПАСНОСТИ")
print("=" * 60)
print(f"DEBUG: {settings.DEBUG}")
print(f"SECURE_SSL_REDIRECT: {getattr(settings, 'SECURE_SSL_REDIRECT', 'NOT SET')}")
print(f"SECURE_HSTS_SECONDS: {getattr(settings, 'SECURE_HSTS_SECONDS', 'NOT SET')}")
print(f"SECURE_PROXY_SSL_HEADER: {getattr(settings, 'SECURE_PROXY_SSL_HEADER', 'NOT SET')}")
print(f"SESSION_COOKIE_SECURE: {getattr(settings, 'SESSION_COOKIE_SECURE', 'NOT SET')}")
print(f"CSRF_COOKIE_SECURE: {getattr(settings, 'CSRF_COOKIE_SECURE', 'NOT SET')}")
print(f"\nSecurityMiddleware в MIDDLEWARE: {'django.middleware.security.SecurityMiddleware' in settings.MIDDLEWARE}")
print(f"\nВсего middleware: {len(settings.MIDDLEWARE)}")
print("=" * 60)

if settings.DEBUG:
    if getattr(settings, 'SECURE_SSL_REDIRECT', False):
        print("⚠️  ВНИМАНИЕ: SECURE_SSL_REDIRECT=True при DEBUG=True!")
    if 'django.middleware.security.SecurityMiddleware' in settings.MIDDLEWARE:
        print("⚠️  ВНИМАНИЕ: SecurityMiddleware активен при DEBUG=True!")
    print("✅ Настройки для локальной разработки должны быть корректными")
else:
    print("ℹ️  Режим продакшена (DEBUG=False)")

