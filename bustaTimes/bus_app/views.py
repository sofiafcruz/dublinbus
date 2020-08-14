from django.shortcuts import render
from django.http import HttpResponse
import json
import datetime
import time
import os
import requests
from bus_app.leap_card.test_leap_card_api import get_leap_card_details
from django.http import JsonResponse

google_maps_key = os.environ.get("GOOGLEMAPS_KEY")
darksky_key = os.environ.get("DARKSKY_KEY")
# Create your views here.

from .forms import FavouriteJourneyForm
from .models import FavouriteJourney

def index(request):

    # USER CREATION FORM
    create_form = CreateUserForm()
    additional_info_form = AdditionalUserInfoForm()

    def conv_2(ep):
        return time.strftime("%a, %d %b %Y %H:%M:%S", time.gmtime(ep+3600))

    # WEATHER
    url = 'https://api.darksky.net/forecast/' + darksky_key + '/53.346,-6.26'

    json_dataset = requests.get(url).text
    json_temp = json.loads(json_dataset)

    # This will be generated everytime there is a page load (wasteful?) - could in the future check for results 
    # Generate hourly for next 48 hours and use that if possible
    # Generate daily which will be the fall back prediction
    day_dict = {
        "Mon":0,
        "Tue":1,
        "Wed":2,
        "Thu":3,
        "Fri":4,
        "Sat":5,
        "Sun":6
    }
    future_weather_dict={}
    # Get next five days (times appear to be midnight of the day they are predicting) - can get hourly for 48 hours
    future_predictions = json_temp['daily']['data']
    for prediction in future_predictions:
        temp_date = conv_2(prediction['time'])
        day = temp_date.split(",")[0]

        # need to get middle range with temperature
        temp = (prediction['temperatureHigh']+prediction['temperatureLow'])/2
        day = day_dict[day]
        future_weather_dict[day] = {
            "temperature": round((temp-32)*5/9,1),
            "rainfall": prediction['precipIntensity'],
            "windspeed": prediction['windSpeed'],
             "cloud":prediction['cloudCover'],
             "visibility":prediction['visibility'],
             "humidity":prediction['humidity']
        }

    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    weather_file = os.path.join(BASE_DIR, 'bus_app/static/future_weather.json')
    # save into csv
    with open(weather_file,"w") as outfile:
        json.dump(future_weather_dict,outfile,indent=4)


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
        'weather': current_weather_js,
        'main_table_data': main_table_data,
        'route_origin_and_destination_data': route_origin_and_destination_data,
        # USER REGISTRATION DETAILS
        'create_form': create_form,
        'additional_info_form': additional_info_form,
    }

    if request.user.is_authenticated:

        # Populate favourite journeys
        user_id = request.user.pk
        user_username = request.user.username
        
        favourite_journeys = FavouriteJourney.objects
        users_favourite_journeys = favourite_journeys.filter(user=user_id)
        
        context["users_favourite_journeys"] = users_favourite_journeys
    
    return render(request, 'index.html', context)

from django.http import HttpResponse
from django.core import serializers

def leap_card_info(request):
    if request.method =='POST':
        leap_card_username = request.POST["inputUsername"]
        leap_card_password = request.POST["inputPassword"]
        # Pass the Username and Password into the leap card API call function
        users_leapcard_details = get_leap_card_details(leap_card_username, leap_card_password)
        balance = users_leapcard_details["balance"]

    return JsonResponse(balance, safe=False)

def make_rpti_realtime_api_request(request):
    if request.method =='GET':
        stopNum = request.GET["inputStopNum"] # Grabs the value of the inputStopNum key in the request.GET QueryDict

    real_time_url = 'https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?type=day&stopid=' + stopNum
    # sending get request and saving the response as response object 
    r = requests.get(url = real_time_url) 
  
    # extracting data in json format 
    data = r.json()
    # print(data)

    # Getting all the details:
    datetime_request_made = data["timestamp"]
    results = data["results"]

    # print(datetime_request_made)

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

        realtime_info_response.append(d)
    
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
                additional_info.save()

                # Show appropriate Success Message
                username = create_form.cleaned_data["username"]
                messages.success(request, f"Account was created for: {username}")

                # Then redirect them to the login page
                return redirect('index')
            else:
                messages.error(request, f"ERROR: in creating account")
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
                messages.error(request, f"ERROR: login credentials incorrect")
                # Message below for debugging purposes
                return redirect('index')
                # return flash message
                # messages.info(request, "Username OR password is incorrect")

@login_required
def logoutUser(request):
    logout(request) # doesn’t throw any errors if the user wasn’t logged in (so need to make sure it works perfectly)
    return redirect('index')

# FAVOURITE JOURNEY

def save_route_journey(request):
    favourite_journey_form = FavouriteJourneyForm()
    if request.method == 'POST':
        # Filling in the form with the data submitted
        favourite_journey_form = FavouriteJourneyForm(request.POST)

        if favourite_journey_form.is_valid():
            # And create the saved journey for the user
            favourite_journey = favourite_journey_form.save(commit=False)
            favourite_journey.user = request.user
            favourite_journey.save()
            
            # Show appropriate Success Message
            messages.success(request, f"Journey favourited for: {request.user}")
            
            # Then redirect them to the login page
            return redirect('index')
        else:
            
            # Generic Error Message
            messages.error(request, f"ERROR: in favouriting journey for: {request.user}... Did not save journey")

            # Specific Error Messages
            for e in favourite_journey_form.errors["__all__"].as_data():
                # If journey attempted to be saved already exists
                if (str(e) == "['Favourite journey with this Route name, Origin stop and Destination stop already exists.']"):
                    messages.error(request, f"ERROR: Journey already exists in favourites... Did not save journey")
                
            return redirect('index')
            
def delete_favourite_journey(request, pk):
    # Testing to see what the PK of the row you want to delete.
    # Trying to delete the Record from the Model
    try:
        query = FavouriteJourney.objects.get(pk=pk)
        query.delete()
        messages.success(request, f"Journey deleted successfully!")
        return redirect('index')
    except:
        messages.error(request, f"ERROR: Journey not deleted...")
        return redirect('index')

# MODEL PREDICTIONS

from bus_app.model_predictions.get_model_predictions import getModelPredictions

def get_journey_prediction(request):
    '''
    Function takes in information from form on front end and queries the model
    '''
    day_dict = {
            "Mon":0,
            "Tue":1,
            "Wed":2,
            "Thu":3,
            "Fri":4,
            "Sat":5,
            "Sun":6
        }

    if request.POST:
        pass
    # print("info")
    # print(request.POST)
    route_ = request.POST.get("route")
    start_stop = request.POST.get("start_stop")
    end_stop = request.POST.get("end_stop")
    date_ = request.POST.get("date")
    time_=request.POST.get("choose-time")

    # This needs to be changed to be automatic (i.e. POST.get)
    # direction=1
    direction= int(request.POST.get("choose-direction"))
    # Get stop number (from value text)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    average_file = "historical_averages_full.json"
    hist = os.path.join(BASE_DIR, 'bus_app/static/{}'.format(average_file))
    with open(hist,) as fp:
        historical_average_data = json.load(fp)

    # Need to search in historical data for non existent in frontend file (only in historical)
    offset_list = ['349', '401', '2567', '2576', '4529', '4678', '5034', '6058', '6333', '7293', '7404', '7405', '7457', '7475', '7479', '7484', '7485', '7486', '7487', '7490', '7492', '7500', '7501', '7502', '7503', '7504', '7537', '7538', '7539', '7540', '7541', '7542', '7544', '7546', '7547', '7566', '7567', '7617', '7620', '7621', '7626', '7627', '7638','7647', '7653', '7655', '7658', '7659', '7668', '7669']    
    # count offset numbers up to starting stop - then add to index - loopin
    offset_count=0
    for option in historical_average_data[route_]["D{}".format(direction)]["order"][:int(start_stop)+1]:
        split_option=option.split("_")

        if split_option[0].strip() in offset_list:
            offset_count +=1

    if int(start_stop)+offset_count < len(historical_average_data[route_]["D{}".format(direction)]["order"])-1:
        segment = historical_average_data[route_]["D{}".format(direction)]["order"][int(start_stop)+offset_count]
    else:
        # get second last segment
        segment = historical_average_data[route_]["D{}".format(direction)]["order"][-1]   
    # get segments including start and end stop - test the correct stop is being obtained
    split_segment=segment.split("_")
    start = split_segment[0].strip()


    split_date = date_.split(" ")
    day_string = split_date[0].strip()
    day = day_dict[day_string]
    # function to determine what weatehr information to use
    current_time = datetime.datetime.now()
 
        # same day?
    if current_time.weekday() == day:
        # use current forecast
        weather_= request.POST.get("model_weather")
        weather_array = weather_.split(",")
    else:
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        weather_file = os.path.join(BASE_DIR, 'bus_app/static/future_weather.json')
        # look up weather array for the day
        weather_array=[]
        with open(weather_file,) as outfile:
            weather_dict = json.load(outfile)
        get_prediction = weather_dict[str(day)]
        weather_array = [get_prediction["temperature"],get_prediction["rainfall"], get_prediction["windspeed"], get_prediction["cloud"], get_prediction["visibility"],get_prediction["humidity"]]

    # split string of weather values
    
    # weather_array = ['temperature','rainfall','windspeed','cloud','visibility']
    Temperature = weather_array[0]
    Rainfall = weather_array[1]
    WindSpeed = weather_array[2]
    Cloud = weather_array[3]
    Visibility = weather_array[4]
    Humidity = weather_array[5]

    prediction = getModelPredictions(route_,direction,start_stop,end_stop,date_,time_,Temperature,Rainfall,WindSpeed,Cloud,Visibility,Humidity,start)

    return HttpResponse(prediction)

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

            # if update_username_form.is_valid() and update_email_form.is_valid() and update_leapcard_username_form.is_valid():
            if update_user_form.is_valid() and update_leapcard_username_form.is_valid():

                # Grab the User
                user = User.objects.get(username=request.user)
                
                # the User details
                updated_username = update_user_form.cleaned_data['username']
                updated_email = update_user_form.cleaned_data['email']

                # the Leap Card Username
                updated_leapcard_username = update_leapcard_username_form.cleaned_data['leapcard_username']

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
                if updated_leapcard_username:
                    user_additional_info = AdditionalUserInfo.objects.get(user=request.user)
                    user_additional_info.leapcard_username = updated_leapcard_username
                    # Then save the details
                    user_additional_info.save()

                messages.success(request, f"Details were updated")
            else:
                messages.error(request, f"ERROR: problem in updating details")
            # Then redirect them to the login page
            return redirect('index')

url = "https://www.dublinbus.ie/News-Centre"

# import BeatifulSoup for web scraping
import json
from bs4 import BeautifulSoup

# creat a news cache to save the loading time
def create_news_cache(timeout_seconds=600):
    import time
    cache = None
    last_timestamp = 0

    def is_not_expire():
        return time.time() - last_timestamp <= timeout_seconds

    # use BeatifulSoup to get news title, published time and hyperlink
    def get_news_from_remote():
        rtn = {}
        try:
            html = requests.get(url)
            soup = BeautifulSoup(html.text, "html.parser")
            head = soup.select(".newsitem_content")[0]
            a = head.select('a')[0]
            rtn['title'] = a.getText().strip()
            rtn['href'] = "https://www.dublinbus.ie" + a.get('href')
            date = head.select('.news_item_date')[0]
            rtn['time'] = date.getText().strip()
            rtn['state'] = 1
        except Exception as e:
            print(e)
            rtn['state'] = 2
        return rtn

    # if there is existed data in cache and it is up to date, return contents from chache, otherwise scrape
    def get_data():
        nonlocal cache
        nonlocal last_timestamp
        if cache and cache['state'] == 1 and is_not_expire():
            return cache
        else:
            cache = get_news_from_remote()
            last_timestamp = time.time()
        return cache

    return {
        'get_data': get_data
    }


news_cache = create_news_cache()


def get_news(request):
    return HttpResponse(json.dumps(news_cache['get_data']()))