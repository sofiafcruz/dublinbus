# BELOW IS CODE I USED IN THE PYTHON MANAGE.PY SHELL TO IMPORT THE CSV DATA INTO THE MODELS;
# N.B. - It wouldn't work if I just run this script, for some reason...
# ==========================================================================================

# 1. ROUTES;
# ==========
# path_to_csv = '/Users/conorginty/Desktop/project_static_data_exploration/final_niall_routes.csv'

# # open file & create csvreader
# import csv

# # import the relevant model
# from bus_app.models import Route

# with open(path_to_csv) as csvfile:
#     reader = csv.reader(csvfile)
#     next(reader, None) # Skips the 1st line (header)
#     for row in reader:

#         route = Route(route_name=row[0], origin=row[1], destination=row[2])

#         try:
#             route.save()
#         except:
#             print("there was a problem somewhere...")

# 2. BUS STOPS;
# =============
path_to_csv = '/Users/conorginty/Desktop/project_static_data_exploration/final_niall_busstops.csv'

# open file & create csvreader
import csv

# import the relevant model
from bus_app.models import BusStop

with open(path_to_csv) as csvfile:
    reader = csv.reader(csvfile)
    next(reader, None) # Skips the 1st line (header)
    for row in reader:
        bus_stop = BusStop(stop_num=row[0], address=row[1], latitude=row[2], longitude=row[3])
        try:
            bus_stop.save()
        except:
            print("there was a problem somewhere...")

# 3. ROUTES AND BUS STOPS;
# ========================
# path_to_csv = '/Users/conorginty/Desktop/project_static_data_exploration/final_niall_routes_and_stops.csv'

# # open file & create csvreader
# import csv

# # import the relevant model
# from bus_app.models import RouteAndStop

# with open(path_to_csv) as csvfile:
#     reader = csv.reader(csvfile)
#     next(reader, None) # Skips the 1st line (header)
#     for row in reader:

#         route_and_stop = BusStop(route_name=row[0], stop_num=row[1], prog_num=row[2])

#         try:
#             route_and_stop.save()
#         except:
#             print("there was a problem somewhere...")