# PYTHON DICTIONARY RECOMMENDED BY CHIDI!!!
# =========================================
# Route = Main key
# Stop_Num = Key of route dictionary value
# routes_and_stops = {
#     1: {381: [address, lat, long, prog_num],
#         382: [address, lat, long, prog_num],
#         ...
#        }, 
#     102: {1041: [address, lat, long, prog_num],
#           1073: [address, lat, long, prog_num],
#           ...
#        },
# }
# return the list object to the javascript

import csv

# VERSION 1 (lists instead of dictionaries)==============================================================

path_to_csv = '/Users/conorginty/Desktop/project_static_data_exploration/main_table.csv'
f = open(path_to_csv)
c = csv.reader(f)
next(c, None) # Skips the 1st line (header)
d = {}
for row in c:
    # print(row)
    route = row[0]
    # If route key is NOT in the dictionary, then initialise the route key (to an empty dict)
    if route not in d:
        d[route] = {}
    # If route key IS in the dictionary, then append the value dictionary with bus_stop keys 
    # (to a list of: [prog_num, address, lat, long])
    if route in d:
        bus_stop = row[1]
        if bus_stop not in d[route]:
            prog_num = int(row[2])
            stop_address = row[3]
            latitude = float(row[4])
            longitude = float(row[5])
            d[route].update({bus_stop: [prog_num, stop_address, latitude, longitude]})

# print(d['1'])
# {'381': ['0', 'Park Avenue', '53.324194999999996', '-6.2122969444'], 
# '382': ['1', "St. John's Road", '53.32509305560001', '-6.20763'], 
# '4451': ['2', 'Strand Road', '53.32594', '-6.2076988888999995'], 
# '383': ['3', 'Strand Road', '53.328603888900005', '-6.20894'], 
# '384': ['4', 'Strand Road', '53.3316088889', '-6.210171944400001'], 
# etc... }

# print(len(d['1'])) # 21

# FINAL HASH MAP LOOK;
# {
#    "1":{
#       "381":[
#          "0",
#          "Park Avenue",
#          "53.324194999999996",
#          "-6.2122969444"
#       ],
#       "382":[
#          "1",
#          "St. John's Road",
#          "53.32509305560001",
#          "-6.20763"
#       ],...
#     },
#     "102":{
#       "1041":[
#          "0",
#          "Swords Road",
#          "53.4540580556",
#          "-6.2117627778"
#       ],
#       "1073":[
#          "1",
#          "Malahide Road",
#          "53.4506925",
#          "-6.1870449999999995"
#       ],...
#     },
# }

# Saving the dictionary to a JSON file;
import json

json_string = json.dumps(d, indent=3)
destination_file = '/Users/conorginty/Desktop/project_static_data_exploration/static_hash_map_lists.json'
with open(destination_file, 'w') as f:
    f.write(json_string)
    f.close()

# VERSION 2 (dictionaries instead of lists)==============================================================

f = open(path_to_csv)
c = csv.reader(f)
next(c, None) # Skips the 1st line (header)
d = {}
for row in c:
    # print(row)
    route = row[0]
    # If route key is NOT in the dictionary, then initialise the route key (to an empty dict)
    if route not in d:
        d[route] = {}
    # If route key IS in the dictionary, then append the value dictionary with bus_stop keys 
    # (to a list of: [prog_num, address, lat, long])
    if route in d:
        bus_stop = row[1]
        if bus_stop not in d[route]:
            prog_num = int(row[2])
            stop_address = row[3]
            latitude = float(row[4])
            longitude = float(row[5])
            d[route].update({bus_stop: {"prog_num":prog_num, 
                                        "stop_address":stop_address, 
                                        "latitude":latitude, 
                                        "longitude":longitude}})

json_string = json.dumps(d, indent=3)
destination_file = '/Users/conorginty/Desktop/project_static_data_exploration/static_hash_map_dicts.json'
with open(destination_file, 'w') as f:
    f.write(json_string)
    f.close()

# VERSION 3 (dictionaries with lists)==============================================================

f = open(path_to_csv)
c = csv.reader(f)
next(c, None) # Skips the 1st line (header)
d = {}
for row in c:
    # print(row)
    route = row[0]
    # If route key is NOT in the dictionary, then initialise the route key (to an empty dict)
    if route not in d:
        d[route] = []
    # If route key IS in the dictionary, then append the value dictionary with bus_stop keys 
    # (to a list of: [prog_num, address, lat, long])
    if route in d:
        bus_stop = row[1]
        if bus_stop not in d[route]:
            prog_num = int(row[2])
            stop_address = row[3]
            latitude = float(row[4])
            longitude = float(row[5])
            d[route].append({bus_stop: {"prog_num":prog_num, 
                                        "stop_address":stop_address, 
                                        "latitude":latitude, 
                                        "longitude":longitude}})

json_string = json.dumps(d, indent=3)
destination_file = '/Users/conorginty/Desktop/project_static_data_exploration/static_hash_map_dicts_and_lists.json'
with open(destination_file, 'w') as f:
    f.write(json_string)
    f.close()

# VERSION 4 (list of dictionaries)==============================================================

f = open(path_to_csv)
c = csv.reader(f)
next(c, None) # Skips the 1st line (header)
d = {}
for row in c:
    # print(row)
    route = row[0]
    # If route key is NOT in the dictionary, then initialise the route key (to an empty dict)
    if route not in d:
        d[route] = []
    # If route key IS in the dictionary, then append the value dictionary with bus_stop keys 
    # (to a list of: [prog_num, address, lat, long])
    if route in d:
        stop_num = row[1]
        stop_address = row[3]
        latitude = float(row[4])
        longitude = float(row[5])
        d[route].append({"stop_num":stop_num, 
                        "stop_address":stop_address, 
                        "latitude":latitude, 
                        "longitude":longitude})

json_string = json.dumps(d, indent=3)
destination_file = '/Users/conorginty/Desktop/project_static_data_exploration/static_hash_map_list_of_dicts.json'
with open(destination_file, 'w') as f:
    f.write(json_string)
    f.close()