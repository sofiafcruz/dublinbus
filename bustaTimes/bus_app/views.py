from django.shortcuts import render
from .models import Route, BusStop, RouteAndStop
# From models.py file in the current folder, import the tables
import os

google_maps_key = os.environ.get("GOOGLEMAPS_KEY")

# Create your views here.

def index(request):
    return render(request, 'index.html', {'google_maps_key':google_maps_key,
                                          'routes': Route.objects.all(),
                                           })

def routes(request):
    
    return render(request, 'index.html', context)

# def get_route(request):
#     value = request.["data"]
#     Route.objects.filter("name"={})