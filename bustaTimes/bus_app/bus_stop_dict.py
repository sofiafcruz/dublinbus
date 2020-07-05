import csv
import json

path_to_csv = '/Users/sofiacruz/Desktop/final_niall_busstops.csv'

f = open(path_to_csv)
c = csv.reader(f)
next(c, None) # Skips the 1st line (header)
d = []

for row in c:
    e = {'stop_num':'', 'address':'', 'latitude':'', 'longitude':''}
    e['stop_num'] = row[0]
    e['address'] = row[1]
    e['latitude'] = row[2]
    e['longitude'] = row[3]
    d.append(e)



json_string = json.dumps(d, indent=3)
destination_file = '/Users/sofiacruz/Desktop/bus_stops.json'
with open(destination_file, 'w') as f:
    f.write(json_string)
    f.close()