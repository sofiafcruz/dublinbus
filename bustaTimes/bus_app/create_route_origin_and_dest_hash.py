import csv

path_to_csv = '/Users/conorginty/Desktop/project_static_data_exploration/final_niall_routes.csv'
f = open(path_to_csv)
c = csv.reader(f)
next(c, None) # Skips the 1st line (header)
d = {}
for row in c:
    # print(row)
    route = row[0]
    # If route key is NOT in the dictionary, then initialise the route key (to a dict of origin and destination)
    if route not in d:
        d[route] = {'origin': row[1], 'destination': row[2]}

import json

json_string = json.dumps(d, indent=3)
destination_file = '/Users/conorginty/Desktop/project_static_data_exploration/static_route_origin_and_destination.json'
with open(destination_file, 'w') as f:
    f.write(json_string)
    f.close()