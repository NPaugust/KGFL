"""
Базовая структура тестов для проекта KGFL.
Тесты можно запускать командой: pytest

ВАЖНО: Тесты не влияют на работу приложения и могут быть запущены отдельно.
"""
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class HealthCheckTestCase(TestCase):
    """Тесты для health check endpoints."""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_health_check_endpoint(self):
        """Проверка работы health check endpoint."""
        response = self.client.get('/api/health/health/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.data)
        self.assertIn('services', response.data)
    
    def test_ready_endpoint(self):
        """Проверка работы ready endpoint."""
        response = self.client.get('/api/health/ready/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('status', response.data)


class AuthenticationTestCase(TestCase):
    """Тесты для аутентификации."""
    
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
    
    def test_login_success(self):
        """Проверка успешного входа."""
        response = self.client.post('/api/users/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.data)
        self.assertIn('refresh_token', response.data)
    
    def test_login_failure(self):
        """Проверка неудачного входа."""
        response = self.client.post('/api/users/login/', {
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


@pytest.mark.skip(reason="Rate limiting тесты требуют настройки кэша")
class RateLimitingTestCase(TestCase):
    """Тесты для rate limiting."""
    
    def setUp(self):
        self.client = APIClient()
    
    def test_rate_limit_on_login(self):
        """Проверка rate limiting на логин."""
        # Попытка более 5 раз подряд
        for i in range(6):
            response = self.client.post('/api/users/login/', {
                'username': 'testuser',
                'password': 'wrongpassword'
            })
        
        # Последний запрос должен вернуть 429
        self.assertEqual(response.status_code, status.HTTP_429_TOO_MANY_REQUESTS)

