from django.contrib import admin

# Register your models here.

from bus_app.models import Route, BusStop, RouteAndStop

admin.site.register(Route)
admin.site.register(BusStop)
admin.site.register(RouteAndStop)

# CUSTOM USER STUFF
# Tutorial 1
# from bus_app.models import CustomUser

# admin.site.register(CustomUser)

# Tutorial 2
from bus_app.models import AdditionalUserInfo

admin.site.register(AdditionalUserInfo)