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
    bus_stops = models.ManyToManyField(BusStop) # A Route can have Many Bus Stops and a Bus Stop can be on Many Routes
    # The line above will create the interlinking table BUT how do we include a 3rd column for prog_num???
    def __str__(self):
        return self.route_name

# Can we do the following below INSTEAD to represent this Many-To-Many relationship???
# class RouteAndStop(models.Model):
#     route_name = models.ForeignKey('Route', on_delete=models.CASCADE)
#     stop_num = models.ForeignKey('BusStop', on_delete=models.CASCADE)
#     prog_num = IntegerField()