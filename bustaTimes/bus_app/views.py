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

    # USER CREATION FORM
    create_form = CreateUserForm()
    additional_info_form = AdditionalUserInfoForm()

    # if request.method == 'POST':

    #     registerUser(request)

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
        # USER REGISTRATION DETAILS
        'create_form': create_form,
        'additional_info_form': additional_info_form,
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
        print(request.POST) # <QueryDict: {'csrfmiddlewaretoken': ['iGxFd71LhQcFutlpl65rExOFsGK2wgipLeIcQRtC83UhgAuuZ7YAj8kXq9cishIL'], 'inputUsername': ['X'], 'inputPassword': ['Y']}>
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

    return JsonResponse(balance, safe=False)

def make_rpti_realtime_api_request(request):
    if request.method =='GET':
        print("IT'S A GET")
        print(request.GET) # e.g. <QueryDict: {'csrfmiddlewaretoken': ['mfh1Pjs9WiIp0pDuCtQfKMDXNuDgoHVIPNsys3U0Nvq1MwMzguJopn9fLX5wkIl4'], 'inputStopNum': ['905']}>
        stopNum = request.GET["inputStopNum"] # Grabs the value of the inputStopNum key in the request.GET QueryDict
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

# ===================================================
# USER LOGIN AND REGISTRATION (To be worked on later)
# ===================================================

from django.contrib.auth.forms import UserCreationForm 
# ^ Handles things like making sure no duplicate usernames, that passwords are hashed etc
# HOWEVER, only issue is it doesn't require a password.
# Therefore, we'll create a variation of it in our forms.py file.
from .forms import CreateUserForm, AdditionalUserInfoForm

from django.shortcuts import redirect
# ^ redirect to new webpage

from django.contrib import messages
# ^ Flash message is a way to send one-time message to the template

from django.contrib.auth import authenticate, login, logout

from django.contrib.auth.decorators import login_required
# ^

def registerPage(request):
    # If the user is authenticated, then redirect them to the home page
    if request.user.is_authenticated:
        return redirect('index.html')
    else:
        # create_form = UserCreationForm()
        create_form = CreateUserForm()
        # ADDITIONAL_INFO
        additional_info_form = AdditionalUserInfoForm()

        if request.method == 'POST':
            # Post data = Username, Password and Conrfirmed password
            # Render the form again and pass in the user data into the form
            # create_form = UserCreationForm(request.POST)

            # Post data = Username, Password, Conrfirmed password AND EMAIL!!
            # Render the form again and pass in the user data into the form
            create_form = CreateUserForm(request.POST)
            # ADDITIONAL_INFO
            additional_info_form = AdditionalUserInfoForm(request.POST)

            if create_form.is_valid() and additional_info_form.is_valid():
                # Then save the User
                user = create_form.save() 
                # ADDITIONAL_INFO
                # And create the additional info for the user
                additional_info = additional_info_form.save(commit=False)
                additional_info.user = user
                additional_info.save()

                # Show appropriate Success Message
                username = create_form.cleaned_data["username"]
                print(create_form.cleaned_data)
                print(username)
                messages.success(request, f"Account was created for: {username}")

                # Then redirect them to the login page
                return redirect('loginPage')

        context = {
            'create_form': create_form,
            # ADDITIONAL_INFO
            'additional_info_form': additional_info_form,
        }
        return render(request, 'register.html', context)

def loginPage(request):
    # If the user is authenticated, then redirect them to the home page
    if request.user.is_authenticated:
        return redirect('index')
    else:
        if request.method == 'POST':
            username = request.POST.get('username')
            password = request.POST.get('password')

            user = authenticate(request, username=username, password=password)

            # If user IS authenticated, then attach them to the current sessopm
            if user is not None:
                login(request, user) # Saves user's ID in the session
                return redirect('index')
            else:
                # Message below for debugging purposes
                print("Someone tried to login and failed")
                print("**************************************")
                print(f"Tried logging in with;\nUsername: {username}\nPassword: {password}")
                print("**************************************")
                # return flash message
                messages.info(request, "Username OR password is incorrect")
        
        context = {}
        return render(request, 'login.html', context)

@login_required
def logoutUser(request):
    logout(request) # doesn’t throw any errors if the user wasn’t logged in (so need to make sure it works perfectly)
    # return redirect('loginPage')
    return redirect('index')

def registerUser(request):
    # If the user is authenticated, then redirect them to the home page
    if request.user.is_authenticated:
        return redirect('index.html')
    else:
        # Post data = Username, Password, Conrfirmed password AND EMAIL!!
        # Render the form again and pass in the user data into the form
        create_form = CreateUserForm(request.POST)
        # ADDITIONAL_INFO
        additional_info_form = AdditionalUserInfoForm(request.POST)

        if create_form.is_valid() and additional_info_form.is_valid():
            # Then save the User
            user = create_form.save() 
            # ADDITIONAL_INFO
            # And create the additional info for the user
            additional_info = additional_info_form.save(commit=False)
            additional_info.user = user
            additional_info.save()

            # Show appropriate Success Message
            username = create_form.cleaned_data["username"]
            print(create_form.cleaned_data)
            print(username)
            messages.success(request, "Account was created for:", username)
        else:
            messages.error(request, f"ERROR: in creating account")
            print("ERROR IN REGISTERING THE USER WITH THE POPUP METHOD")
        # Then redirect them to the login page
        return redirect('index')

from django.contrib.auth.hashers import make_password
# ^ For hashing the password that's stored
       
def registerUserPopup(request):
    # If the user is authenticated, then redirect them to the home page
    if request.user.is_authenticated:
        return redirect('index')
    else:
        # REQUIRED INFO
        create_form = CreateUserForm()
        # ADDITIONAL INFO
        additional_info_form = AdditionalUserInfoForm()

        if request.method == 'POST':

            # Post data = Username, Password, Confirmed password, email, AND Additional info
            # Render the form again and pass in the user data into the form
            create_form = CreateUserForm(request.POST)
            # ADDITIONAL_INFO
            additional_info_form = AdditionalUserInfoForm(request.POST)

            if create_form.is_valid() and additional_info_form.is_valid():
                # Then save the User
                user = create_form.save() 
                # ADDITIONAL_INFO
                # And create the additional info for the user
                additional_info = additional_info_form.save(commit=False)
                additional_info.user = user
                # Hasing the password
                print(f"Before Hashing: {additional_info.leapcard_password}")
                additional_info.leapcard_password = make_password(additional_info.leapcard_password)
                print(f"After Hashing: {additional_info.leapcard_password}")
                additional_info.save()

                # Show appropriate Success Message
                username = create_form.cleaned_data["username"]
                print(create_form.cleaned_data)
                print(username)
                messages.success(request, f"Account was created for: {username}")

                # Then redirect them to the login page
                return redirect('index')
            else:
                messages.error(request, f"ERROR: in creating account")
                print("ERROR IN REGISTERING THE USER WITH THE POPUP METHOD")
            # Then redirect them to the login page
            return redirect('index')

def loginUserPopup(request):
    # If the user is authenticated, then redirect them to the home page
    if request.user.is_authenticated:
        return redirect('index')
    else:
        if request.method == 'POST':
            username = request.POST.get('username')
            password = request.POST.get('password')

            user = authenticate(request, username=username, password=password)

            # If user IS authenticated, then attach them to the current sessopm
            if user is not None:
                login(request, user) # Saves user's ID in the session
                return redirect('index')
            else:
                # Message below for debugging purposes
                print("Someone tried to login and failed")
                print("**************************************")
                print(f"Tried logging in with;\nUsername: {username}\nPassword: {password}")
                print("**************************************")
                return redirect('index')
                # return flash message
                # messages.info(request, "Username OR password is incorrect")

from django.views.decorators.csrf import csrf_protect

@csrf_protect
def save_route_journey(request):
    if request.method == 'POST':
        print(request.POST)
        # form2 = UserProfileForm(request.POST, prefix = "profile")
        # if form1.is_valid() and form2.is_valid():
        #     #create initial entry for user
        #     username = form1.cleaned_data["username"]
        #     password = form1.cleaned_data["password"]
        #     new_user = User.objects.create_user(username, password)
        #     new_user.save()

        #     #create entry for UserProfile (extension of new_user object)      
        #     profile = form2.save(commit = False)
        #     profile.user = new_user
        #     profile.save()
        #     return HttpResponseRedirect("/books/")