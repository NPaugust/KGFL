# Инструкции по деплою KGFL

## 1. Деплой фронтенда на Vercel

### Подготовка:
1. Убедитесь что билд прошел успешно: `npm run build`
2. Зафиксируйте изменения в Git:
   ```bash
   git add .
   git commit -m "Prepare for production deployment"
   git push origin main
   ```

### Деплой на Vercel:
1. Перейдите на https://vercel.com/npaugusts-projects
2. Нажмите "New Project"
3. Импортируйте ваш Git репозиторий
4. Настройки проекта:
   - **Framework Preset**: Next.js
   - **Root Directory**: `front`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

5. Переменные окружения в Vercel:
   - `NEXT_PUBLIC_API_URL` = `https://avgustin.pythonanywhere.com`

6. Нажмите "Deploy"

## 2. Деплой бэкенда на PythonAnywhere

### Подготовка на PythonAnywhere:

1. **Загрузите код на сервер:**
   ```bash
   # В консоли PythonAnywhere
   cd ~
   git clone [ваш-репозиторий-url] kgfl
   cd kgfl
   ```

2. **Создайте виртуальное окружение:**
   ```bash
   mkvirtualenv kgfl --python=python3.10
   workon kgfl
   cd ~/kgfl/back
   pip install -r requirements.txt
   ```

3. **Настройте MySQL базу данных:**
   - Перейдите в раздел "Databases" в панели PythonAnywhere
   - Создайте MySQL базу данных с именем `kgfl` (полное имя будет `avgustin$kgfl`)
   - Установите пароль для базы данных
   - Запомните данные подключения

4. **Настройте переменные окружения:**
   ```bash
   # В ~/.bashrc добавьте:
   export DB_NAME="avgustin$kgfl"
   export DB_USER="avgustin"
   export DB_PASSWORD="[ваш-пароль-от-бд]"
   export DB_HOST="avgustin.mysql.pythonanywhere-services.com"
   export DJANGO_SETTINGS_MODULE="kgfl.settings_production"
   ```

5. **Создайте директории:**
   ```bash
   mkdir -p ~/kgfl/staticfiles
   mkdir -p ~/kgfl/media
   mkdir -p ~/kgfl/logs
   ```

6. **Выполните миграции:**
   ```bash
   cd ~/kgfl/back
   python manage.py migrate --settings=kgfl.settings_production
   python manage.py collectstatic --noinput --settings=kgfl.settings_production
   python manage.py createsuperuser --settings=kgfl.settings_production
   ```

### Настройка Web App в PythonAnywhere:

1. **Перейдите в раздел "Web" панели управления**
2. **Создайте новое веб-приложение:**
   - Выберите "Manual configuration"
   - Python version: 3.10

3. **Настройки в разделе "Code":**
   - **Source code**: `/home/avgustin/kgfl/back`
   - **WSGI configuration file**: `/var/www/avgustin_pythonanywhere_com_wsgi.py`

4. **Отредактируйте WSGI файл:**
   ```python
   import os
   import sys

   path = '/home/avgustin/kgfl/back'
   if path not in sys.path:
       sys.path.append(path)

   os.environ['DJANGO_SETTINGS_MODULE'] = 'kgfl.settings_production'

   from django.core.wsgi import get_wsgi_application
   application = get_wsgi_application()
   ```

5. **Настройте виртуальное окружение:**
   - **Virtualenv**: `/home/avgustin/.virtualenvs/kgfl`

6. **Настройте статические файлы:**
   - URL: `/static/`
   - Directory: `/home/avgustin/kgfl/staticfiles/`
   
   - URL: `/media/`
   - Directory: `/home/avgustin/kgfl/media/`

7. **Перезагрузите веб-приложение**

### Настройка CORS:

После деплоя фронтенда на Vercel, обновите домен в `settings_production.py`:
```python
CORS_ALLOWED_ORIGINS = [
    "https://[ваш-домен].vercel.app",
    "http://localhost:3000",
]
```

## 3. Финальные шаги

1. **Тестирование:**
   - Проверьте что API доступен: `https://avgustin.pythonanywhere.com/api/`
   - Проверьте что фронтенд работает на Vercel
   - Проверьте что данные загружаются правильно

2. **Загрузка тестовых данных (опционально):**
   ```bash
   cd ~/kgfl/back
   python manage.py shell --settings=kgfl.settings_production
   # Выполните команды для создания тестовых данных
   ```

## 4. Мониторинг и обновления

### Обновление кода:
```bash
cd ~/kgfl
git pull origin main
workon kgfl
cd back
pip install -r requirements.txt
python manage.py migrate --settings=kgfl.settings_production
python manage.py collectstatic --noinput --settings=kgfl.settings_production
# Перезагрузите веб-приложение в панели управления
```

### Логи:
- **Django логи**: `~/kgfl/logs/django.log`
- **PythonAnywhere логи**: в разделе "Tasks" панели управления
- **Vercel логи**: в дашборде Vercel

## Домены:
- **Frontend**: https://[ваш-проект].vercel.app
- **Backend API**: https://avgustin.pythonanywhere.com/api/
- **Admin панель**: https://avgustin.pythonanywhere.com/admin/
