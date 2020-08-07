from .base_settings import *

# ALLOWED_HOSTS = ['ipa-018.ucd.ie']

DEBUG = True

INSTALLED_APPS += [
    'debug_toolbar',
]

MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware', ]

# Database
# https://docs.djangoproject.com/en/3.0/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': os.path.join(BASE_DIR, 'db.sqlite3'),
    }
}

# EMAIL-TESTING
# =============
# Instead of sending out real emails the console backend just writes the emails that would be sent to the standard output. By default, the console backend writes to stdout. You can use a different stream-like object by providing the stream keyword argument when constructing the connection.
# This backend is not intended for use in production – it is provided as a convenience that can be used during development.
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
'''
command = python3 manage.py sendtestemail test@gmail.com
Result:
Content-Type: text/plain; charset="utf-8"
MIME-Version: 1.0
Content-Transfer-Encoding: 7bit
Subject: Test email from Conors-MacBook-Air.local on 2020-07-27
 14:28:05.492651+00:00
From: webmaster@localhost
To: test@gmail.com
Date: Mon, 27 Jul 2020 14:28:05 -0000
Message-ID: <159586008549.75034.13908606671295172846@Conors-MacBook-Air.local>

If you're reading this, it was successful.
-------------------------------------------------------------------------------
'''

# DJANGO-DEBUG-TOOLBAR CONFIGURATIONS
# ===================================
INTERNAL_IPS = ('127.0.0.1', '0.0.0.0', 'localhost',)

DEBUG_TOOLBAR_PANELS = [
    'debug_toolbar.panels.versions.VersionsPanel',
    'debug_toolbar.panels.timer.TimerPanel',
    'debug_toolbar.panels.settings.SettingsPanel',
    'debug_toolbar.panels.headers.HeadersPanel',
    'debug_toolbar.panels.request.RequestPanel',
    'debug_toolbar.panels.sql.SQLPanel',
    'debug_toolbar.panels.staticfiles.StaticFilesPanel',
    'debug_toolbar.panels.templates.TemplatesPanel',
    'debug_toolbar.panels.cache.CachePanel',
    'debug_toolbar.panels.signals.SignalsPanel',
    'debug_toolbar.panels.logging.LoggingPanel',
    'debug_toolbar.panels.redirects.RedirectsPanel',
]