from django.contrib import admin

# Register your models here.

from bus_app.models import Route, BusStop

admin.site.register(Route)
admin.site.register(BusStop)