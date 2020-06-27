from django.db import models

# # Create your models here.
class BusStop(models.Model):
    stop_num = models.CharField(primary_key=True, max_length=20)
    address = models.CharField(max_length=100)
    latitude = models.CharField(max_length=100)
    longitude = models.CharField(max_length=100)

    def __str__(self):
        return self.stop_num

class Route(models.Model):
    route_name = models.CharField(primary_key=True, max_length=20) 
    origin = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    bus_stops = models.ManyToManyField(BusStop, through='RouteAndStop') # A Route can have Many Bus Stops and a Bus Stop can be on Many Routes

    def __str__(self):
        return self.route_name

# Can we do the following below INSTEAD to represent this Many-To-Many relationship???
class RouteAndStop(models.Model):
    route_name = models.ForeignKey(Route, on_delete=models.CASCADE)
    stop_num = models.ForeignKey(BusStop, on_delete=models.CASCADE)
    prog_num = models.IntegerField()

# HOW WE CAN ACCESS ALL THE STOPS IN A ROUTE;
# ===========================================
# route_1 = Route.objects.get(pk=1)
# route_1.bus_stops.all()
# <QuerySet [<BusStop: 381>, <BusStop: 382>, <BusStop: 4451>, <BusStop: 383>, <BusStop: 384>, <BusStop: 385>, <BusStop: 387>, <BusStop: 388>, <BusStop: 389>, <BusStop: 393>, <BusStop: 371>, <BusStop: 391>, <BusStop: 392>, <BusStop: 395>, <BusStop: 396>, <BusStop: 397>, <BusStop: 398>, <BusStop: 399>, <BusStop: 400>, <BusStop: 319>, '...(remaining elements truncated)...']>
# len(route_1.bus_stops.all())
# 21