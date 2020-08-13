
import pickle
import pandas as pd
import os
from django.conf import settings
import json
import datetime

day_dict = {
    "Mon":0,
    "Tue":1,
    "Wed":2,
    "Thu":3,
    "Fri":4,
    "Sat":5,
    "Sun":6
}
reverse_day_dict={
    0:"Monday",
    1:"Tuesday",
    2:"Wednesday",
    3:"Thursday",
    4:"Friday",
    5:"Saturday",
    6:"Sunday",

}

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

time_slot={
    'morn':[6,7,8,9,10,11],
    'afternoon':[12,13,14,15],
    'rush_eve':[16,17,18,19],
    'night':[20,21,22,23,0,1]
}

# def get_seconds()

def comparison(test,query):
    print("test: ",test)
    print("query: ",query)
    if query[:2]=="00":
        query="24:{}".format(query[3:]) 
    if query[:2]=="01":
        query="25:{}".format(query[3:])
    if int(test[:2]) > int(query[:2]):
        return test
    elif int(test[:2]) == int(query[:2]) and int(test[3:]) > int(query[3:]):
        return test
    else:
        return "None"

def get_timetable_info(route,direction,time,day,stop):
    # want to open up the dicitonary look at the given route, day, directoin
    print(route)
    print(direction)
    print(time)
    print("day: ",day)
    print(type(day))
    if day in [0,1,2,3,4]:
        day=0

    print(stop)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    name = os.path.join(BASE_DIR, 'static/timetable_dict.json')
    with open(name) as outfile:
        timetable_dict = json.load(outfile)
    # need to search for closest time within that list
    print("day times:")
    # print(timetable_dict[route]["D{}".format(direction)]["stops"][stop]["days"][str(day)][0])
    time_list=timetable_dict[route]["D{}".format(direction)]["stops"][stop]["days"][str(day)]
    # get larger times, then get min of that list
    greater_list = [t[:5] for t in time_list if comparison(t[:5],time) != "None"]
    # I HAVE NOT ACCOUNTED FOR IF THE NEXT DAY CONTAINS NO JOURNEy - currently just returns 'none'
    print("LIST: ", greater_list)
    if len(greater_list)==0:
        try:
            if day ==5:
                next_day=6
            else:
                next_day=0
            
            answer = timetable_dict[route]["D{}".format(direction)]["stops"][stop]["days"][str(next_day)][0][:5]
            print("NEXT DAY:    ", answer)
            return answer, True
        except:
            print("couldn't find anythin")
            return "None",False
    else: 
        answer = min(greater_list)
        # answer = min(time_list, key=lambda t: abs(query - datetime.datetime.strptime(t[0:5], "%H:%M")))
        print("Same day: ",answer)
        return answer, False
    # for time in time_list:
    #     print(type())



def getModelPredictions(route,direction,start_stop,end_stop,date,time,temp,rain,wind,cloud,visibility,humidity,stop_name):
    print("{} \n {} \n{} \n {} \n{} \n {} \n{} \n {} \n{} \n {} \n".format(route,start_stop,end_stop,date,time,temp,rain,wind,cloud,visibility))
    # preprocessing - get day,month and bank holiday from date (for now BH = 0)
    # split on empty space
    split_date = date.split(" ")
    day_temp = split_date[0].strip()
    month_temp = split_date[1].strip()
    day = day_dict[day_temp]
    month = month_dict[month_temp]

    # These need to be updated to dynamic variables and direction needs
    bank_hol = 0
    
    print("Hour beforehand:  {}".format(time))
     # Get starting time (using timetable_dict)
    time,next_day = get_timetable_info(route,direction,time,day,stop_name)
    if time =="None":
        return "Error in obtaining journey time, please pick another time"
    
    # print("DAY OUTSIDE:  ",day)

    # print("time after:  {}".format(processed_time))
    # round hour to closest number
    split_hour = time.split(":")
    hr = int(split_hour[0])
    minut = int(split_hour[1])
    if minut > 30:
        hr +=1
    hour = str(hr)

   




    # Make copy of model_dict and change the values according to inputted values 
    # parameters = model_dict.copy()
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    name = os.path.join(BASE_DIR, 'static/model_metrics_cv.json')
    with open(name) as outfile:
        model_params = json.load(outfile)

    param_list = model_params[route]["direction_{}".format(direction)]['cols']
    print(param_list)
    parameters={}
    for elem in param_list:
        if elem != "Unnamed: 0" and elem != 'trip_time':
            parameters[elem] =0
    print("dictionary:", parameters)

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
    
    column_headers = []
    row = []
    for key in parameters:
        column_headers.append(key)
        row.append(parameters[key])
    row_embedded = [row]
    # print(column_headers)
    # print(row_embedded)
    # Make df out of values
    formatted_parameters = pd.DataFrame(row_embedded,columns=column_headers)
    print("formatted parameters: ",formatted_parameters.columns)
    # print('FORMATTED PARAMETERS',formatted_parameters.shape)
    # print(formatted_parameters)
    # print(formatted_parameters.dtypes)
    # print(formatted_parameters)

    # Select correct model using route
    model_name = "{}_D{}.sav".format(route,direction)
    print(model_name)

    try:
        model = os.path.join(BASE_DIR, 'static/model_files/{}'.format(model_name))
    # file = open(test,'rb')
        with open(model, 'rb') as p:
            loaded_model = pickle.load(p)

    # Use the loaded pickled model to make predictions 
        prediction = loaded_model.predict(formatted_parameters)
        print(prediction[0])

    # USES JUST HISTORICAL AVERAGE - FOR COMPARISON
        # average_file = "historical_average.json"
        # hist = os.path.join(BASE_DIR, 'static/{}'.format(average_file))
        # with open(hist,) as fp:
        #     historical_average_data = json.load(fp)
        # segments = historical_average_data[route]["direction_{}".format(direction)]["order"]
        # # get segments including start and end stop
        # journey_segments = segments[int(start_stop):int(end_stop)]
        # offset = 0
        # for key in historical_average_data[route]["direction_{}".format(direction)]["segments"]:
        #     # if key not in journey_segments:
        #         # offset+=float(historical_average_data[route]["direction_{}".format(direction)]["segments"][key])
        #     if key in journey_segments:
        #         offset+=float(historical_average_data[route]["direction_{}".format(direction)]["segments"][key][1])
        
        average_file = "historical_averages_full.json"
        hist = os.path.join(BASE_DIR, 'static/{}'.format(average_file))
        with open(hist,) as fp:
            historical_average_data = json.load(fp)
        
        segments = historical_average_data[route]["D{}".format(direction)]["order"]
        # get segments including start and end stop
        journey_segments = segments[int(start_stop):int(end_stop)]
        offset = 0

        # Loop through each segment and find appropriate time slot and add up % of all appropriate segments
        slot = 'N/A'
        print("Hour: ",hour)
        for key in time_slot:
            if int(hour) in time_slot[key]:
                slot=key
        print("slot:  ",slot)
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
                # return some kind of error message which lists valid times? [or returns some kind of timetable]
                print("invalid time please select a time")
                return "WRONG TIME SLOT"
        else:
            # This is for a time outside dublin bus hours - limit clock?
            print("not a valid time")
            return "WRONG TIME SLOT"

        print("OFFSET AMOUNT: ",offset)
        # final_pred = prediction[0]-offset
        final_pred = prediction[0]*offset
        final = final_pred//60

        # if next_day = True it means this must be stated, otherwise just return back the next bus time
        if next_day:
            message ="Next journey is at: {} -  {}".format(time,reverse_day_dict[day+1])
        else:
            message ="Next journey is at: {}".format(time)
            
        if int(final)<1:
            final=" < 1"
            return " {} minute  \n ".format(final) + message

        # return some info on next bus available??

        return "{} minutes  \n".format(int(final)) + message
        


    except Exception as e:
        print("model don't exist gurl")
        print(e)
