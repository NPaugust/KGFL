#!/usr/bin/env python
import os
import sys
import django

# Настройка Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'kgfl.settings')
django.setup()

from core.models import User

def check_kgfl_user():
    try:
        user = User.objects.get(username='kgfl')
        print(f"✅ Пользователь найден:")
        print(f"   Username: {user.username}")
        print(f"   Role: {user.role}")
        print(f"   Is superuser: {user.is_superuser}")
        print(f"   Is staff: {user.is_staff}")
        print(f"   Is active: {user.is_active}")
        return True
    except User.DoesNotExist:
        print("❌ Пользователь 'kgfl' не найден")
        return False

if __name__ == '__main__':
    check_kgfl_user() 