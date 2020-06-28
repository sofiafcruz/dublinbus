from django.shortcuts import render
# From models.py file in the current folder, import the tables
from .models import Route, BusStop, RouteAndStop
# From forms.py file in the current folder, import the forms
from .forms import RouteForm
import os

google_maps_key = os.environ.get("GOOGLEMAPS_KEY")

# Create your views here.

def index(request):
    all_routes = Route.objects.all()
    route_form = RouteForm()
    # print(route_form)
    # print(all_routes)
    context = {
        'google_maps_key':google_maps_key,
        'routes': all_routes,
        'route_form': route_form,
    }
    return render(request, 'index.html', context)

from django.http import HttpResponse
def show_route(request):
    
    return HttpResponse("Show Route Page")