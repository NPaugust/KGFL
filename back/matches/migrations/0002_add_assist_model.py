from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('players', '0001_initial'),
        ('clubs', '0001_initial'),
        ('matches', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='Assist',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('minute', models.PositiveIntegerField(verbose_name='Минута')),
                ('team', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assists', to='clubs.club', verbose_name='Команда')),
                ('player', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assists', to='players.player', verbose_name='Игрок')),
                ('match', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='assists', to='matches.match', verbose_name='Матч')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Дата обновления')),
            ],
            options={
                'verbose_name': 'Передача',
                'verbose_name_plural': 'Передачи',
                'ordering': ['match', 'minute'],
            },
        ),
    ]
