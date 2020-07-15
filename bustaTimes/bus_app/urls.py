from django.urls import path
from bus_app import views

urlpatterns = [
    path('', views.index, name="index"),
    path('show_route', views.show_route, name="show_route"),
    path('show_modelform_route', views.show_modelform_route, name="show_modelform_route"),
    path('create_json_response_obj', views.create_json_response_obj, name="create_json_response_obj"),
    path('leap_card_info', views.leap_card_info, name="leap_card_info"),
    # Trying to interact with 3rd party API via backend with view below
    path('trying_to_access_third_party_api', views.trying_to_access_third_party_api, name="trying_to_access_third_party_api"),
]