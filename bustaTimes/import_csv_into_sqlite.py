# BELOW IS CODE I USED IN THE PYTHON MANAGE.PY SHELL TO IMPORT THE CSV DATA INTO THE MODELS;
# N.B. - It wouldn't work if I just run this script, for some reason...
# ==========================================================================================

# 1. ROUTES;
# ==========
# path_to_csv = '/Users/conorginty/Desktop/project_static_data_exploration/niall_english_routes_cleaned.csv'

# # open file & create csvreader
# import csv

# # import the relevant model
# from bus_app.models import Route

# with open(path_to_csv, newline='') as csvfile:
#     spamreader = csv.reader(csvfile)# , delimiter=',', quotechar='|')
#     next(spamreader, None) # Skips the 1st line (header)
#     for row in spamreader:

#         # route = Route(Route_ID=row_values[1], Route_Num=row_values[2], Origin=row_values[3], Destination=row_values[4])
#         route = Route(route_id=row[1], name=row[2], origin=row[3], destination=row[4])

#         try:
#             route.save()
#         except:
#             print("there was a problem somewhere...")


# 2. BUS STOPS AND ROUTES;
# ========================