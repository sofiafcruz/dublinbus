from django.shortcuts import render
from bus_app import models
import os

google_maps_key = os.environ.get("GOOGLEMAPS_KEY")

# Create your views here.

def index(request):
    return render(request, 'index.html', {'google_maps_key':google_maps_key})

# def get_route(request):
#     value = request.["data"]
#     models.Route.objects.filter("name"={})