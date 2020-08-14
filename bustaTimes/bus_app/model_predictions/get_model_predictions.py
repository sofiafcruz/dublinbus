
import pickle
import pandas as pd
import os
from django.conf import settings
import json
import datetime

# The function of this script is to:
# 1. take in the information necessary for the models from the frontend
# 2. Preprocess that information so that it is in the suitable format for model querying
# 3. Find next suitable journey from timetable information
# 4. Return appropriate information to the frontend of the app


# Set of dictionaries for data preprocessing

# convert day of the week to integer representation
day_dict = {
    "Mon":0,
    "Tue":1,
    "Wed":2,
    "Thu":3,
    "Fri":4,
    "Sat":5,
    "Sun":6
}
# convert integer representation of day to string version
reverse_day_dict={
    0:"Monday",
    1:"Tuesday",
    2:"Wednesday",
    3:"Thursday",
    4:"Friday",
    5:"Saturday",
    6:"Sunday",

}
# convert month of the year to integer representation
month_dict = {
    "Jan":1,
    "Feb":2,
    "Mar":3,
    "Apr":4,
    "May":5,
    "Jun":6,
    "Jul":7,
    "Aug":8,
    "Sep":9,
    "Oct":10,
    "Nov":11,
    "Dec":12
}
# Dictionary for deciphering appropriate time slot for a given hour of the day
time_slot={
    'morn':[6,7,8,9,10,11],
    'afternoon':[12,13,14,15],
    'rush_eve':[16,17,18,19],
    'night':[20,21,22,23,0]
}

# def get_seconds()

def comparison(test,query):
    '''
    Function takes in two times (test and query) HH:MM format and returns 'test' if it is later in the day, or 'None' otherwise
    '''
    if query[:2]=="00":
        query="24:{}".format(query[3:]) 
    if int(test[:2]) > int(query[:2]):
        return test
    elif int(test[:2]) == int(query[:2]) and int(test[3:]) > int(query[3:]):
        return test
    else:
        return "None"

def get_timetable_info(route,direction,time,day,stop):
    '''
    Function compares input time (frontend) against timetable to get the next closest departure time
    '''
    # want to open up the dicitonary look at the given route, day, direction

    # As mon-fri (0-4) have the same timetable, they can all be set to 0
    if day in [0,1,2,3,4]:
        day=0

    # Read in json file containing timetable information
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    name = os.path.join(BASE_DIR, 'static/timetable_dict.json')
    with open(name) as outfile:
        timetable_dict = json.load(outfile)
    # need to search for closest time within that list
    time_list=timetable_dict[route]["D{}".format(direction)]["stops"][stop]["days"][str(day)]
    # get larger times, then get min of that list
    greater_list = [t[:5] for t in time_list if comparison(t[:5],time) != "None"]

    # If the list is empty, meaning there are now next suitable times, look at the following day
    if len(greater_list)==0:
        try:
            if day ==5:
                next_day=6
            else:
                next_day=0
            
            answer = timetable_dict[route]["D{}".format(direction)]["stops"][stop]["days"][str(next_day)][0][:5]
            return answer, True
        except:
            return "None",False
    else: 
        answer = min(greater_list)
        return answer, False




def getModelPredictions(route,direction,start_stop,end_stop,date,time,temp,rain,wind,cloud,visibility,humidity,stop_name):
    '''
    Function takes in all relevant journey information, queries the model, offsets the total journey time appropriately and returns the journey time prediction
    '''
    # split on empty space
    split_date = date.split(" ")
    day_temp = split_date[0].strip()
    month_temp = split_date[1].strip()
    day = day_dict[day_temp]
    month = month_dict[month_temp]

    # list of [days,month] that are bank holidays
    bank_holidays=[[1,1],[17,3],[2,4],[7,5],[4,6],[6,8],[29,10],[25,12],[26,12]]
    if [day,month] in bank_holidays:
        bank_hol = 1
    else:
        bank_hol = 0
    
     # list of routes for which no timetable information is available
    no_timetable_route_list=['116', '118','16d','130','120','25d','25x', '31d', '32x','33e','39x','41a','42d','46e', '51d','51x','68x','70d','77x']


    if route in no_timetable_route_list:
         next_day=False
    else:
        # search for the next appropriate time on the timetable
        time,next_day = get_timetable_info(route,direction,time,day,stop_name)
        if time =="None":
            return "Error in obtaining journey time, please pick another time"
    
    # print("DAY OUTSIDE:  ",day)
    if "24" in time[:2]:
        time="00:{}".format(time[3:])

    # round hour to closest number
    split_hour = time.split(":")
    hr = int(split_hour[0])
    minut = int(split_hour[1])
    if minut > 30:
        hr +=1
    hour = str(hr)

    # read in json file with information about model parameters required for a given route
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    name = os.path.join(BASE_DIR, 'static/model_metrics_cv.json')
    with open(name) as outfile:
        model_params = json.load(outfile)

    # Get list of parameters specific for that route and direction
    param_list = model_params[route]["direction_{}".format(direction)]['cols']
    parameters={}
    for elem in param_list:
        if elem != "Unnamed: 0" and elem != 'trip_time':
            parameters[elem] =0

    # Use the current weather info
    parameters["temp"] = float(temp)
    parameters["rain"] = float(rain)
    parameters["wind_spe"] = float(wind)
    parameters["cloud"] = float(cloud)
    parameters["visibility"] = float(visibility)
    parameters["humidity"] = float(humidity)


    # dummy variables (change relevant col to 1) - will change to 1 if present otherwise leave all as 0
    # Some flaws in this system, the model should have all months/days but may have only certain hours as dummy variables
    # Need to filter possible times at the frontend or within here to deny prediction within certain time frames or provide
    # a generic prediction based on a default time
    try:
        # default is 1 (jan) - if fails to get key then defaults to dummy variable
        temp = parameters["month_{}".format(month)]
        parameters["month_{}".format(month)]= 1
    except:
        pass
    try:
        # default = 0 (monday)
        temp=parameters["day_of_week_{}".format(day)]
        parameters["day_of_week_{}".format(day)] = 1
    except:
        pass
    try:
        # 12 is 0 - this is the default - will need to control so that only valid times can come in
        temp=parameters["hour_{}".format(hour)]
        parameters["hour_{}".format(hour)] = 1
    except:
        pass

    # Create a df for the model input information
    column_headers = []
    row = []
    for key in parameters:
        column_headers.append(key)
        row.append(parameters[key])
    row_embedded = [row]

    # Make df out of values
    formatted_parameters = pd.DataFrame(row_embedded,columns=column_headers)

    # Select correct model using route
    model_name = "{}_D{}.sav".format(route,direction)
    print(model_name)

    try:
         # try opening the model pickle file
        model = os.path.join(BASE_DIR, 'static/model_files/{}'.format(model_name))
        with open(model, 'rb') as p:
            loaded_model = pickle.load(p)

    # Use the loaded pickled model to make predictions 
        prediction = loaded_model.predict(formatted_parameters)
        
        average_file = "historical_averages_full.json"
        hist = os.path.join(BASE_DIR, 'static/{}'.format(average_file))
        with open(hist,) as fp:
            historical_average_data = json.load(fp)
        
        # get list of all sections on a given route (i.e. section is between two stops)
        segments = historical_average_data[route]["D{}".format(direction)]["order"]
        # splice list to get only the segments relevant to the journey prediction being requested
        journey_segments = segments[int(start_stop):int(end_stop)]
        offset = 0
        if hour=="24":
            hour=0

        # Loop through each segment and find appropriate time slot and add up % of all appropriate segments
        slot = 'N/A'
        for key in time_slot:
            if int(hour) in time_slot[key]:
                slot=key

        # get rmse value
        rmse = int(model_params[route]["direction_{}".format(direction)]['cv']["rmse"]/60)
        if rmse ==0:
            rmse=1

        # if it is a valid time slot
        if slot !='N/A':
            # times with 'NaN' are not valid i.e. time isn't appropriate
            if slot not in historical_average_data[route]["D{}".format(direction)]['invalid_times']:
                for seg in historical_average_data[route]["D{}".format(direction)]["segments"]:
                    # add up % of all segments within the slice 'journey_segments'
                    if seg in journey_segments:
                        offset+=float(historical_average_data[route]["D{}".format(direction)]["segments"][seg][slot][1])
            else:
                # This is for if the time is in a time slot (i.e. not early hours of morning) but not valid for this journey
                return "sorry there is no journey information available for route {} at {}".format(route,time)
        else:
            # This is for a time outside dublin bus hours
            return "sorry there is no journey information available for route {} at {}".format(route,time)

        final_pred = prediction[0]*offset
        final = final_pred//60

        # if next_day = True it means this must be stated, otherwise just return back the next bus time
        if route in  no_timetable_route_list:
            message="There is timetable available for this route <hr> <small id='little_text' class=text-muted> * Journey predictions for the entire route (i.e. end to end) should be accurate within {} {}, shorter journey predictions may show greater levels of variance </small>".format(rmse,minute)
        else:
            if rmse==1:
                minute="minute"
            else:
                minute="minutes"
            if next_day:
                message ="Next journey is at: <br> {} -  {} <hr> <small id='little_text' class=text-muted> * Journey predictions for the entire route (i.e. end to end) should be accurate within {} {}, shorter journey predictions may show greater levels of variance </small>".format(time,reverse_day_dict[day+1],rmse,minute)
            else:
                message ="Next journey is at: {} <hr> <small id='little_text'  class=text-muted> * Journey predictions for the entire route (i.e. end to end) should be accurate within {} {}, shorter journey predictions may show greater levels of variance </small>".format(time,rmse,minute)

        
            
        if int(final)<1:
            final=" < 1"
            return " {} minute  <br> ".format(final) + message

        # return some info on next bus available??

        return "{} minutes  <br> ".format(int(final)) + message
        


    except Exception as e:
        print("model don't exist gurl")
        print(e)
