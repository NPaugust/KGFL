"""
Management command для автоматического обновления статуса сезонов.
Запускать через cron раз в день или после создания/обновления сезона.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import Season
from datetime import date


class Command(BaseCommand):
    help = 'Автоматически активирует/деактивирует сезоны на основе дат начала и окончания'

    def handle(self, *args, **options):
        today = date.today()
        updated_count = 0
        
        # Деактивируем сезоны, которые закончились
        finished_seasons = Season.objects.filter(
            is_active=True,
            end_date__lt=today
        )
        
        for season in finished_seasons:
            season.is_active = False
            season.save()
            updated_count += 1
            self.stdout.write(
                self.style.WARNING(f'✓ Сезон "{season.name}" деактивирован (дата окончания: {season.end_date})')
            )
        
        # Активируем сезоны, которые начались (и еще не закончились)
        # Важно: активируем только если нет других активных сезонов
        active_seasons_count = Season.objects.filter(is_active=True).count()
        
        if active_seasons_count == 0:
            # Если нет активных сезонов, активируем сезон, который начался и еще не закончился
            current_season = Season.objects.filter(
                start_date__lte=today,
                end_date__gte=today
            ).order_by('-start_date').first()
            
            if current_season:
                current_season.is_active = True
                current_season.save()
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Сезон "{current_season.name}" активирован автоматически')
                )
        else:
            # Если есть активные сезоны, проверяем не нужно ли активировать новый
            upcoming_season = Season.objects.filter(
                start_date__lte=today,
                end_date__gte=today,
                is_active=False
            ).order_by('-start_date').first()
            
            if upcoming_season:
                # Деактивируем все остальные активные сезоны
                Season.objects.filter(is_active=True).exclude(id=upcoming_season.id).update(is_active=False)
                
                upcoming_season.is_active = True
                upcoming_season.save()
                updated_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Сезон "{upcoming_season.name}" активирован, остальные деактивированы')
                )
        
        if updated_count == 0:
            self.stdout.write(self.style.SUCCESS('✓ Статусы сезонов актуальны, изменений не требуется'))
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\n✓ Обновлено сезонов: {updated_count}')
            )

