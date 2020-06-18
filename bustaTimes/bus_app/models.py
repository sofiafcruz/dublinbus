# from django.db import models

# # Create your models here.

# class Route(models.Model):
#     # Route ID defined automatically
#     name = models.CharField(max_length=20) # Maybe this should be the ID/Primary Key instead?
#     origin = models.CharField(max_length=100)
#     destination = models.CharField(max_length=100)

#     def __str__(self):
#         return self.name

# class BusStop(models.Model):
#     # BusStop ID defined automatically
#     route = models.ForeignKey('bus_app.Route', on_delete=models.CASCADE)
#     pnum = IntegerField()
#     stopID = models.CharField(max_length=20) # Maybe this should be the ID/Primary Key instead?
#     latitude = models.CharField(max_length=100)
#     longitude = models.CharField(max_length=100)

#     def __str__(self):
#         return self.stopID + ": " + self.stopname
    