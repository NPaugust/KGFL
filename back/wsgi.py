#!/home/avgustin/.virtualenvs/kgfl/bin/python

"""
WSGI config for KGFL project on PythonAnywhere.

This module contains the WSGI application used by Django's development server
and any production WSGI deployments. It should expose a module-level variable
named ``application``. Django's ``runserver`` and ``runfcgi`` commands discover
this application via the ``WSGI_APPLICATION`` setting.

Usually you will have the standard Django WSGI application here, but it also
might make sense to replace the whole Django WSGI application with a custom one
that later delegates to the Django one. For example, you could introduce WSGI
middleware here, or combine a Django application with an application of another
framework.

"""

import os
import sys

# add your project directory to the sys.path
path = '/home/avgustin/kgfl'
if path not in sys.path:
    sys.path.append(path)

os.environ['DJANGO_SETTINGS_MODULE'] = 'kgfl.settings_production'

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
