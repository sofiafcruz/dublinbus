import pickle
import pandas as pd
import os
from django.conf import settings
import json

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

model_dict = {'rain': 0,
 'temp': 0,
 'cloud': 0,
 'visibility': 0,
 'wind_spe': 0,
 'humidity': 0,
 'segment_time':60,
 'month_2': 0,
 'month_3': 0,
 'month_4': 0,
 'month_5': 0,
 'month_6': 0,
 'month_7': 0,
 'month_8': 0,
 'month_9': 0,
 'month_10': 0,
 'month_11': 0,
 'month_12': 0,
 'day_of_week_1': 0,
 'day_of_week_2': 0,
 'day_of_week_3': 0,
 'day_of_week_4': 0,
 'day_of_week_5': 0,
 'day_of_week_6': 0,
 'hour_6': 0,
 'hour_7': 0,
 'hour_8': 0,
 'hour_9': 0,
 'hour_10': 0,
 'hour_11': 0,
 'hour_12': 0,
 'hour_13': 0,
 'hour_14': 0,
 'hour_15': 0,
 'hour_16': 0,
 'hour_17': 0,
 'hour_18': 0,
 'hour_19': 0,
 'hour_20': 0,
 'hour_21': 0,
 'hour_22': 0,
 'hour_23': 0,
 'public_holiday_1': 0
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
    parameters = model_dict.copy()
    # change weather parameters
    parameters["temp"] = temp
    parameters["rain"] = rain
    parameters["wind_spe"] = wind
    parameters["cloud"] = cloud
    parameters["visibility"] = visibility
    parameters["humidity"] = humidity

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
    for key in model_dict:
        column_headers.append(key)
        row.append(model_dict[key])
    row_embedded = [row]
    # print(column_headers)
    # print(row_embedded)
    # Make df out of values
    formatted_parameters = pd.DataFrame(row_embedded,columns=column_headers)
    print(formatted_parameters.shape)
    # print(formatted_parameters)
    print(formatted_parameters.dtypes)

    # Select correct model using route
    model_name = "{}_D{}.sav".format(route,direction)
    print(model_name)

    try:
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        model = os.path.join(BASE_DIR, 'static/model_files/{}'.format(model_name))
    # file = open(test,'rb')
        with open(model, 'rb') as p:
            loaded_model = pickle.load(p)

    # Use the loaded pickled model to make predictions 
        prediction = loaded_model.predict(formatted_parameters)
        print(prediction[0])


    # Calculate offset (get direction, start and stop  - add that splice of segment order list to new list and then go through segment dict and substract time for each segment
    # ) 
        average_file = "historical_average.json"
        hist = os.path.join(BASE_DIR, 'static/{}'.format(average_file))
        with open(hist,) as fp:
            historical_average_data = json.load(fp)
        segments = historical_average_data[route]["direction_{}".format(direction)]["order"]
        # get segments including start and end stop
        journey_segments = segments[int(start_stop):int(end_stop)]
        offset = 0
        for key in historical_average_data[route]["direction_{}".format(direction)]["segments"]:
            if key not in journey_segments:
                offset+=float(historical_average_data[route]["direction_{}".format(direction)]["segments"][key])

        final_pred = prediction[0]-offset
        final = final_pred//60

        return int(final)
        


    except Exception as e:
        print("model don't exist gurl")
        print(e)
