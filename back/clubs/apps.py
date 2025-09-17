from django.apps import AppConfig


class ClubsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'clubs'
    
    def ready(self):
        """Импортируем сигналы при запуске приложения."""
        import clubs.signals 