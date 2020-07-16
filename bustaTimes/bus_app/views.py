from django.shortcuts import render
import json
# From models.py file in the current folder, import the tables
from .models import Route, BusStop, RouteAndStop
# From forms.py file in the current folder, import the forms
from .forms import RouteForm
from .forms import RouteModelForm
import os
import requests
from bus_app.leap_card.test_leap_card_api import get_leap_card_details

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
    # =======================================================

    # Grabbing the JSON object containing the Main Table Info
    main_table_json_file = open('bus_app/static/main_table_data.json')   
    data1 = json.load(main_table_json_file) # deserialises it
    main_table_data = json.dumps(data1) # json formatted string

    main_table_json_file.close()

    # Grabbing the JSON object containing the Route Origin and Destination Info
    route_origin_and_destination_file = open('bus_app/static/origin_and_destination_data.json')   
    data1 = json.load(route_origin_and_destination_file) # deserialises it
    route_origin_and_destination_data = json.dumps(data1) # json formatted string

    route_origin_and_destination_file.close()

    context = {
        'google_maps_key':google_maps_key,
        'routes': all_routes,
        "bus_stops": all_stops,
        # 'bus_stops': bus_stops_json,
        'route_form': route_form,
        'route_model_form': route_model_form,
        'weather': current_weather_js,
        'main_table_data': main_table_data,
        'route_origin_and_destination_data': route_origin_and_destination_data,
    }
    
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

def leap_card_info(request):
    if request.method =='POST':
        print("IT'S A POST")
        print(request.POST)
        leap_card_username = request.POST["inputUsername"]
        leap_card_password = request.POST["inputPassword"]
        print(f"User entered the following credentials;\n=============================\nUsername: {leap_card_username}, Password: {leap_card_password}")
        # Pass the Username and Password into 
        users_leapcard_details = get_leap_card_details(leap_card_username, leap_card_password)
        balance = users_leapcard_details["balance"]

    elif request.method =='GET':
        print("IT'S A GET")
    else:
        print("Not a post or a get")
    return HttpResponse(f"Your Leap Card Balance is: \n{balance}")

def trying_to_access_third_party_api(request):
    if request.method =='POST':
        print("IT'S A POST")
        print(request.POST)
        stopNum = request.POST["inputStopNum"]
    elif request.method =='GET':
        print("IT'S A GET")
        print(request.GET)
        stopNum = request.GET["inputStopNum"]
    else:
        print("Not a post or a get")

    real_time_url = 'https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?type=day&stopid=' + stopNum
    print(real_time_url)

    # sending get request and saving the response as response object 
    r = requests.get(url = real_time_url) 
  
    # extracting data in json format 
    data = r.json()
    # print(data)

    # Getting all the details:
    datetime_request_made = data["timestamp"]
    results = data["results"]

    print(datetime_request_made)

    realtime_info_response = []

    for result in results:
        # print(result)
        d = {}
        d["route"] = result["route"]
        d["direction"] = result["direction"]
        d["origin"] = result["origin"]
        d["destination"] = result["destination"]
        d["scheduled_arrival_datetime"] = result["scheduledarrivaldatetime"]
        d["arrival_datetime"] = result["arrivaldatetime"]
        d["due"] = result["duetime"]
        print("==============START==============")
        # print("Route:", result["route"])
        # print("Direction:", result["direction"])
        # print("Origin:", result["origin"])
        # print("Destination:", result["destination"])
        # print("Scheduled Date Time:", result["scheduledarrivaldatetime"])
        # print("Arrival Date Time:", result["arrivaldatetime"])
        # print("Due:", result["duetime"])
        print(d)
        realtime_info_response.append(d)
    
    # print(realtime_info_response)
    json_string = json.dumps(realtime_info_response)
    return JsonResponse(json_string, safe=False)
    # return HttpResponse("Trying to access 3rd Party data")