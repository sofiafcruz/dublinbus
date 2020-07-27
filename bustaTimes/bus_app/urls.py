from django.urls import path
from bus_app import views

from django.contrib.auth.views import PasswordResetView

urlpatterns = [
    path('', views.index, name="index"),
    path('show_route', views.show_route, name="show_route"),
    path('show_modelform_route', views.show_modelform_route, name="show_modelform_route"),
    path('create_json_response_obj', views.create_json_response_obj, name="create_json_response_obj"),
    path('leap_card_info', views.leap_card_info, name="leap_card_info"),
    # Interacting with 3rd party RPTI API via backend with view below
    path('make_rpti_realtime_api_request', views.make_rpti_realtime_api_request, name="make_rpti_realtime_api_request"),
    # Register/Login-related views/links
    path('registerPage', views.registerPage, name="registerPage"),
    path('loginPage', views.loginPage, name="loginPage"),
    path('logoutUser', views.logoutUser, name="logoutUser"),
    # REGISTRATION POP-UP
    path('registerUserPopup', views.registerUserPopup, name="registerUserPopup"),
    path('loginUserPopup', views.loginUserPopup, name="loginUserPopup"),
    # SAVE ROUTE JOURNEY
    path('save_route_journey', views.save_route_journey, name="save_route_journey"),
    # SHOW FAVOURITES
    path('showFavourites', views.showFavourites, name="showFavourites"),
    path('showFavouritesPopup', views.showFavouritesPopup, name="showFavouritesPopup"),
    # DELETE FAVOURITES
    path('delete_favourite_journey', views.delete_favourite_journey, name="delete_favourite_journey"),
    # PASSWORD RESET
    # path('password_reset', views.password_reset, name="password_reset"),

    # CBV Version
    # Provides a form for our user to fill out that will send a password reset instruction to their email
    # path('password_reset', PasswordResetView.as_view(), name="password_reset"),

]