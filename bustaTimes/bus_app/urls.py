from django.urls import path
from bus_app import views

urlpatterns = [
    path('', views.index, name="index"),
    path('show_route', views.show_route, name="show_route"),
    path('show_modelform_route', views.show_modelform_route, name="show_modelform_route"),
    path('create_json_response_obj', views.create_json_response_obj, name="create_json_response_obj"),
    path('leap_card_info', views.leap_card_info, name="leap_card_info"),
    # Trying to interact with 3rd party API via backend with view below
    path('make_rpti_realtime_api_request', views.make_rpti_realtime_api_request, name="make_rpti_realtime_api_request"),
]