from django.db import models

# # Create your models here.

class Route(models.Model):
    route_name = models.CharField(primary_key=True, max_length=20) 
    origin = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)

    def __str__(self):
        return self.name

# class BusStop(models.Model):
#     stop_num = models.CharField(max_length=20)
#     address = models.CharField(max_length=100)
#     latitude = models.CharField(max_length=100)
#     longitude = models.CharField(max_length=100)

#     def __str__(self):
#         return self.stopID + ": " + self.stopname

# class RouteAndStop(models.Model):
#     route_name = models.ForeignKey('bus_app.Route', on_delete=models.CASCADE)
#     stop_num = models.ForeignKey('bus_app.BusStop', on_delete=models.CASCADE)
#     prog_num = IntegerField()