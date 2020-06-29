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

from django.http import JsonResponse

# def tell_route(request, route_name):
#     print("===============")
#     print(route_name)
#     print("===============")
#     return JsonResponse({'route_name': route_name})

import json
def tell_route(request, route_name):
    route_pk = "TEST"
    all_routes = Route.objects

    if request.method =='POST':
        # Trying to figure out how to grab the route instance...
        route_pk = request.POST.get('route') # Grabs the value of the route key in the request.POST QueryDict
        print(request.POST) # <QueryDict: {'csrfmiddlewaretoken': ['mfh1Pjs9WiIp0pDuCtQfKMDXNuDgoHVIPNsys3U0Nvq1MwMzguJopn9fLX5wkIl4'], 'route': ['1']}>
        print(route_pk)
        selected_route = all_routes.get(pk=route_pk) # Grabs the object/instance from the Route table instances that matches the pk/route_name entered
        bus_stops_on_route = selected_route.get_all_bus_stops() # queryset of all the busstops of the chosen route
        print(bus_stops_on_route)
        print(bus_stops_on_route.values()) # prints a queryset of attributes of busstops as dictionaries
        print("-------------------")
    # elif request.method =='GET':
    #     print("Hello")
    #     route_pk = request.GET
    #     print(route_pk)

    return HttpResponse("We got: " + route_pk)