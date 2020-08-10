from .base_settings import *

DEBUG = False

# We could use this in the allowed hosts instead of: 'ipa-018.ucd.ie'
possibly_remote_IP_address = '137.43.49.64'

ALLOWED_HOSTS = ['ipa-018.ucd.ie', 'localhost', '137.43.49.64', '127.0.0.1']

# Database
# https://docs.djangoproject.com/en/3.0/ref/settings/#databases

# POSTGRES DB HERE
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ["DB_NAME"],
        'USER': os.environ["DB_USER"],
        'PASSWORD': os.environ["DB_PASS"],
        'HOST': '127.0.0.1',
        'PORT': '5432',
    }
}

# EMAIL_HOST = 'smtp.gmail.com'
# EMAIL_PORT = 587
# EMAIL_USE_TLS = True
# EMAIL_HOST_USER = os.environ.get("EMAIL_USER")
# EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_PASS")