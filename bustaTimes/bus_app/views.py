from django.shortcuts import render
from django.http import HttpResponse
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

from .forms import FavouriteJourneyForm
from .models import FavouriteJourney

def index(request):

    # USER CREATION FORM
    create_form = CreateUserForm()
    additional_info_form = AdditionalUserInfoForm()

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
    Cloud = json_temp['currently']['cloudCover']
    Visibility = json_temp['currently']['visibility']
    Humidity = json_temp['currently']['humidity']

    current_weather = [{"temperature": Temperature, "rainfall": Rainfall, "icon": Icon, "windspeed": WindSpeed, "cloud":Cloud,"visibility":Visibility,"humidity":Humidity}]
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

    if request.user.is_authenticated:
        # Print in backend to show user logged in
        print(f"User: {request.user} logged in...")
        
        # Not sure if form needed?
        # favourite_journey_form = FavouriteJourneyForm()
        # context["favourite_journey_form"] = favourite_journey_form

        # Populate favourite journeys
        user_id = request.user.pk
        user_username = request.user.username
        
        favourite_journeys = FavouriteJourney.objects
        # print(favourite_journeys)
        # print("====Favourite Journey Fields====")
        # all_fields = FavouriteJourney._meta.get_fields()
        # print(all_fields)
        # print(f"====User: {user_username}'s favourite journeys====")
        users_favourite_journeys = favourite_journeys.filter(user=user_id)
        
        context["users_favourite_journeys"] = users_favourite_journeys
    
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

from django.contrib.auth.hashers import make_password
# ^ For hashing the password that's stored

# REGISTRATION/lOGIN/LOGOUT

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
            # print("====BEFORE USER FORM DATA====")
            # print(create_form.data)
            # print("====BEFORE ADDITIONAL FORM DATA====")
            # print(additional_info_form.data)
            # Post data = Username, Password, Confirmed password, email, AND Additional info
            # Render the form again and pass in the user data into the form
            create_form = CreateUserForm(request.POST)
            # ADDITIONAL_INFO
            additional_info_form = AdditionalUserInfoForm(request.POST)

            # print("====USER FORM START====")
            # print(create_form)
            # print("====USER FORM DATA====")
            # print(create_form.data)
            # print("====USER FORM END====")
            # print("====ADDITIONAL FORM START====")
            # print(additional_info_form)
            # print("====ADDITIONAL FORM DATA====")
            # print(additional_info_form.data)
            # print("====ADDITIONAL FORM END====")
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
                messages.success(request, f"Successfully logged in")
                # Backend authenticated the credentials
                login(request, user) # Saves user's ID in the session
                return redirect('index')
            else:
                print("Is none")
                messages.error(request, f"ERROR: login credentials incorrect")
                # Message below for debugging purposes
                print("Someone tried to login and failed")
                print("**************************************")
                print(f"Tried logging in with;\nUsername: {username}\nPassword: {password}")
                print("**************************************")
                return redirect('index')
                # return flash message
                # messages.info(request, "Username OR password is incorrect")

@login_required
def logoutUser(request):
    logout(request) # doesn’t throw any errors if the user wasn’t logged in (so need to make sure it works perfectly)
    # return redirect('loginPage')
    return redirect('index')

# FAVOURITE JOURNEY

def save_route_journey(request):
    print("Save Route Journey being called")
    favourite_journey_form = FavouriteJourneyForm()
    if request.method == 'POST':
        # print("====DATA POSTED====")
        # print(request.POST)
        # print("====LOGGED IN USER'S NAME====")
        # print(request.user)
        # print("====EMPTY FORM====")
        # print(favourite_journey_form)
        # print("====EMPTY FORM DATA====")
        # print(favourite_journey_form.data)
        # Filling in the form with the data submitted
        favourite_journey_form = FavouriteJourneyForm(request.POST)
        # print("====FILLED FORM====")
        # print(favourite_journey_form)
        # print("====FILLED FORM DATA====")
        # print(favourite_journey_form.data)
        # I THINK THE ISSUE IS THAT WE ARE MISSING THE USER'S CREDENTIALS
        print(favourite_journey_form.data)
        if favourite_journey_form.is_valid():
            print("FAVOURITE JOURNEY FORM IS VALID :)")
            # And create the saved journey for the user
            favourite_journey = favourite_journey_form.save(commit=False)
            print("++++++++++++++++++")
            print("Saving Journey...")
            print("++++++++++++++++++")
            favourite_journey.user = request.user
            favourite_journey.save()
            
            # Show appropriate Success Message
            messages.success(request, f"Journey favourited for: {request.user}")
            
            # Then redirect them to the login page
            return redirect('index')
        else:
            print("FAVOURITE JOURNEY FORM NOT VALID!!! :(")
            messages.error(request, f"ERROR: in favouriting journey for: {request.user}... Did not save journey")
            return redirect('index')
            # print(favourite_journey_form.errors)
            # print(favourite_journey_form.is_valid())
            # context = {"form": favourite_journey_form}
            # return render(request, 'favourite_journey_errors.html', context)

def delete_favourite_journey(request, pk):
    # Testing to see what the PK of the row you want to delete.
    print("DELETE VIEW CALLED!")
    print("PK of favourite journey instance attempting to delete:", pk)
    # Trying to delete the Record from the Model
    try:
        query = FavouriteJourney.objects.get(pk=pk)
        query.delete()
        print("Deleted!")
        messages.success(request, f"Journey deleted successfully!")
        return redirect('index')
    except:
        print("The Object you tried to delete doesn't appear to exist")
        messages.error(request, f"ERROR: Journey not deleted...")
        return redirect('index')

# MODEL PREDICTIONS

from bus_app.model_predictions.get_model_predictions import getModelPredictions


def get_journey_prediction(request):
    if request.POST:
        pass
    print("info")
    print(request.POST)
    route_ = request.POST.get("route")
    start_stop = request.POST.get("start_stop")
    end_stop = request.POST.get("end_stop")
    date_ = request.POST.get("date")
    time_=request.POST.get("choose-time")

    # This needs to be changed to be automatic (i.e. POST.get)
    direction=1
    
    weather_ = request.POST.get("model_weather")
    # print("{} \n {} \n {} \n {} \n {} \n ".format(route_,start_stop,end_stop,date_,time_))
    # print("hey")
    # split string of weather values
    weather_array = weather_.split(",")
    # weather_array = ['temperature','rainfall','windspeed','cloud','visibility']
    Temperature = weather_array[0]
    Rainfall = weather_array[1]
    WindSpeed = weather_array[2]
    Cloud = weather_array[3]
    Visibility = weather_array[4]
    Humidity = weather_array[5]

    

    prediction = getModelPredictions(route_,direction,start_stop,end_stop,date_,time_,Temperature,Rainfall,WindSpeed,Cloud,Visibility,Humidity)
    print("Final_pred:  {}".format(prediction))
    # context={}
    # context['prediction'] = prediction
    # return render(request, 'index.html', context)
    return HttpResponse(prediction)
    # return JsonResponse(prediction, safe=False)
    # return redirect('index')

# Update User Credentials View
from .forms import UpdateUserForm, UpdateLeapCardUsernameForm

from django.contrib.auth.models import User
from .models import AdditionalUserInfo

def updateUserPopup(request):
    if request.user.is_authenticated:
        # Form for Username and Email
        update_user_form = UpdateUserForm()
        # Form for LeapCard Username
        update_leapcard_username_form = UpdateLeapCardUsernameForm()

        if request.method == 'POST':
            
            # Post data = Username, email and Leapcard Username
            # Render the form again and pass in the user data into the form
            # USERNAME and EMAIL
            update_user_form = UpdateUserForm(request.POST)
            # LEAPCARD
            update_leapcard_username_form = UpdateLeapCardUsernameForm(request.POST)

            print(request.POST)
            # if update_username_form.is_valid() and update_email_form.is_valid() and update_leapcard_username_form.is_valid():
            if update_user_form.is_valid() and update_leapcard_username_form.is_valid():

                # Grab the User
                user = User.objects.get(username=request.user)
                
                # the User details
                updated_username = update_user_form.cleaned_data['username']
                updated_email = update_user_form.cleaned_data['email']

                # the Leap Card Username
                updated_leapcard_username = update_leapcard_username_form.cleaned_data['leapcard_username']

                print("/////////////////////////")
                print("ORIGINAL...")
                print(user.username)
                print(user.email)
                print(user.additionaluserinfo.leapcard_username)
                print("UPDATED...")
                print(updated_username)
                print(updated_email)
                print(updated_leapcard_username)
                print("/////////////////////////")

                # Then update with the posted form data 

                # Username
                if updated_username:
                    user.username = updated_username
                # Email
                if updated_email:
                    user.email = updated_email
                # Then save the details 
                user.save()

                # Leap Card Username 
                # Option 1; (NOT UPDATING FOR SOME REASON!!!)
                # user.additionaluserinfo.leapcard_username = updated_leapcard_username

                # Option 2; (Works)
                if updated_leapcard_username:
                    user_additional_info = AdditionalUserInfo.objects.get(user=request.user)
                    user_additional_info.leapcard_username = updated_leapcard_username
                    # Then save the details    
                    user_additional_info.save()

                messages.success(request, f"Details were updated")
            else:
                messages.error(request, f"ERROR: problem in updating details")
                print("-----Username or Email Error-----")
                print(update_user_form.errors)
                print(update_user_form.errors.as_data())
                
                print("-----Leap Card Username Error-----")
                print(update_leapcard_username_form.errors)
                print(update_leapcard_username_form.errors.as_data())
            # Then redirect them to the login page
            return redirect('index')