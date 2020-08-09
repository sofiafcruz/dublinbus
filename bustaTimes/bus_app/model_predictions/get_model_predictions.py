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
    'night':[20,21,22,23,0]
}



def getModelPredictions(route,direction,start_stop,end_stop,date,time,temp,rain,wind,cloud,visibility,humidity):
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
    try:
        # default is 1 (jan)
        parameters["month_{}".format(month)] = 1
    except:
        pass
    try:
        # default = 0 (monday)
        parameters["day_of_week_{}".format(day)] = 1
    except:
        pass
    try:
        # 12 is 0 - this is the default - will need to control so that only valid times can come in
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
        
        average_file = "hist_averages_corrected.json"
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
            for seg in historical_average_data[route]["D{}".format(direction)]["segments"]:
                # add up % of all segments within the slice 'journey_segments'
                if seg in journey_segments:
                    offset+=float(historical_average_data[route]["D{}".format(direction)]["segments"][seg][slot][1])
        else:
            print("not a valid time")

        print(offset)
        # final_pred = prediction[0]-offset
        final_pred = prediction[0]*offset
        final = final_pred//60

        return int(final)
        


    except Exception as e:
        print("model don't exist gurl")
        print(e)
