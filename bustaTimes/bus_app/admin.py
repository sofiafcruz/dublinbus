from django.contrib import admin

# Register your models here.

from bus_app.models import Route, BusStop, RouteAndStop

admin.site.register(Route)
admin.site.register(BusStop)
admin.site.register(RouteAndStop)