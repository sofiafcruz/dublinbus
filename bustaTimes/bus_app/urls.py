from django.urls import path
from bus_app import views

urlpatterns = [
    path('', views.index, name="index"),
]