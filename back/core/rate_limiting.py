"""
Простое rate limiting для защиты от злоупотреблений.
"""
from django.core.cache import cache
from django.http import JsonResponse
from django.utils import timezone
from functools import wraps
import time


def rate_limit(max_requests=60, window=60, key_func=None):
    """
    Декоратор для ограничения частоты запросов.
    Работает как с обычными view функциями, так и с методами ViewSet.
    
    Args:
        max_requests: Максимальное количество запросов за окно времени
        window: Окно времени в секундах
        key_func: Функция для генерации ключа (по умолчанию используется IP)
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(*args, **kwargs):
            # Определяем request: для ViewSet методов это второй аргумент (self, request)
            # для обычных view функций это первый аргумент (request)
            request = None
            
            # Пробуем найти request в аргументах
            for arg in args:
                if hasattr(arg, 'META') and hasattr(arg, 'method'):
                    # Это request объект
                    request = arg
                    break
            
            if not request:
                # Если не нашли в args, пробуем kwargs
                request = kwargs.get('request')
            
            if not request:
                # Если все еще не нашли, вызываем функцию без rate limiting
                return view_func(*args, **kwargs)
            
            # Генерируем ключ для rate limiting
            if key_func:
                key = key_func(request)
            else:
                # Используем IP адрес и путь
                ip = request.META.get('REMOTE_ADDR', 'unknown')
                path = request.path
                key = f'rate_limit:{ip}:{path}'
            
            # Получаем текущее количество запросов
            current = cache.get(key, 0)
            
            if current >= max_requests:
                # Превышен лимит
                return JsonResponse(
                    {
                        'error': 'Слишком много запросов. Пожалуйста, попробуйте позже.',
                        'retry_after': window
                    },
                    status=429
                )
            
            # Увеличиваем счетчик
            cache.set(key, current + 1, window)
            
            # Вызываем оригинальную view функцию
            return view_func(*args, **kwargs)
        
        return wrapper
    return decorator

