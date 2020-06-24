from django.shortcuts import render
from bus_app import models
# Create your views here.

def index(request):
    return render(request, 'index.html', {})

# def get_route(request):
#     value = request.["data"]
#     models.Route.objects.filter("name"={})