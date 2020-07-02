from django.shortcuts import render
import json
# From models.py file in the current folder, import the tables
from .models import Route, BusStop, RouteAndStop
# From forms.py file in the current folder, import the forms
from .forms import RouteForm
from .forms import RouteModelForm
import os
import requests

google_maps_key = os.environ.get("GOOGLEMAPS_KEY")

# Create your views here.

def index(request):
    all_routes = Route.objects.all()
    all_stops = BusStop.objects.all()

    route_form = RouteForm()
    route_model_form = RouteModelForm

    # all_bus_stops = BusStop.objects.all()
    # stops=[]
    # for stop in all_bus_stops:
    #     stop_temp={"number": stop.stop_num, "address": stop.address, "latitude": stop.latitude, "longitude": stop.longitude}
    #     stops.append(stop_temp)
    # bus_stops_json = json.dumps(stops)

    # WEATHER
    url = 'https://api.darksky.net/forecast/313018b2afc91b7825d89c2740c19873/53.346,-6.26'

    json_dataset = requests.get(url).text
    json_temp = json.loads(json_dataset)

    Temperature = round((json_temp['currently']['temperature']-32) * 5/9, 1)
    Rainfall = json_temp['currently']['precipIntensity']
    Icon = json_temp['currently']['icon']
    WindSpeed = json_temp['currently']['windSpeed']

    current_weather = [{"temperature": Temperature, "rainfall": Rainfall, "icon": Icon, "windspeed": WindSpeed}]
    current_weather_js = json.dumps(current_weather)

    context = {
        'google_maps_key':google_maps_key,
        'routes': all_routes,
        "bus_stops": all_stops,
        # 'bus_stops': bus_stops_json,
        'route_form': route_form,
        'route_model_form': route_model_form,
        'weather': current_weather_js
    }
    # print(bus_stops_json)
    print(all_routes)
    return render(request, 'index.html', context)

from django.http import JsonResponse
def create_json_response_obj(request):
    route_objs_list = list(Route.objects.values())  # wrap in list(), because QuerySet is not JSON serializable
    bus_stops_objs_list = list(BusStop.objects.values())  # wrap in list(), because QuerySet is not JSON serializable
    return JsonResponse({
                            'route_objs_list':route_objs_list,
                            'bus_stops_objs_list':bus_stops_objs_list
                        })

from django.http import HttpResponse
from django.core import serializers

def show_route(request):
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
        print("------------------------------------------------------")
    # elif request.method =='GET':
    #     print("Hello")
    #     route_pk = request.GET
    #     print(route_pk)
    
    bus_stop_data = serializers.serialize("json", bus_stops_on_route)

    context = {
        'selected_route': selected_route,
        'bus_stops_on_route':bus_stops_on_route.values(),
        'bus_stop_data': bus_stop_data,
    }
    print("================================================================")
    print(bus_stop_data)
    # return HttpResponse("We got: " + route_pk)
    return render(request, 'show_route.html', context)

def show_modelform_route(request):
    if request.method =='POST':
        print("IT'S A POST")
        print(request.POST)
    elif request.method =='GET':
        print("IT'S A GET")
    else:
        print("Not a post or a get")
    return HttpResponse("You selected a route from the Model Form Dropdown")