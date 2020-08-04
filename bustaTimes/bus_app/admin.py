from django.contrib import admin

# Register your models here.

# from bus_app.models import Route, BusStop, RouteAndStop

# admin.site.register(Route)
# admin.site.register(BusStop)
# admin.site.register(RouteAndStop)

from bus_app.models import AdditionalUserInfo

admin.site.register(AdditionalUserInfo)

from bus_app.models import FavouriteJourney

admin.site.register(FavouriteJourney)