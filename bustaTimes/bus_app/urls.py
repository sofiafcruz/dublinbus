from django.urls import path
from bus_app import views

from django.contrib.auth.views import PasswordResetView

urlpatterns = [
    path('', views.index, name="index"),
    # THE 3 BELOW ARE MOST LIKELY UNNEEDED!!!
    # path('show_route', views.show_route, name="show_route"),
    # path('show_modelform_route', views.show_modelform_route, name="show_modelform_route"),
    # path('create_json_response_obj', views.create_json_response_obj, name="create_json_response_obj"),
    # DISPLAY LEAP CARD BALANCE
    path('leap_card_info', views.leap_card_info, name="leap_card_info"),
    # Interacting with 3rd party RPTI API via backend with view below
    path('make_rpti_realtime_api_request', views.make_rpti_realtime_api_request, name="make_rpti_realtime_api_request"),
    # Register/Login/Logout
    path('logoutUser', views.logoutUser, name="logoutUser"),
    path('registerUserPopup', views.registerUserPopup, name="registerUserPopup"),
    path('loginUserPopup', views.loginUserPopup, name="loginUserPopup"),
    # USER DETAILS UPDATE
    path('updateUserPopup', views.updateUserPopup, name="updateUserPopup"),
    # SAVE ROUTE JOURNEY
    path('save_route_journey', views.save_route_journey, name="save_route_journey"),
    # DELETE FAVOURITES
    path('delete_favourite_journey/<int:pk>/', views.delete_favourite_journey, name="delete_favourite_journey"),
    # MODEL PREDICTION
    path('get_journey_prediction', views.get_journey_prediction, name="get_journey_prediction"),
    
]