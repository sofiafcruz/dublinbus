# Required so clicking dropdown options triggers corresponding info pull from DB
from django import forms
# from .models import Route

# class RouteForm(forms.Form):
#     select_form = forms.ModelChoiceField(queryset=Route.objects.all(),
#                                         widget=forms.Select(attrs={'class':'drop-down-list'}))

# # Using a model form instead...
# # https://stackoverflow.com/questions/5104277/field-choices-as-queryset
# from django.forms.widgets import Select
# class RouteModelForm(forms.ModelForm):
#     class Meta:
#         CHOICES = Route.objects.all()

#         model = Route
#         fields = ['route_name']
#         widgets = {
#             'route_name': Select(choices=((route.pk, route.route_name) for route in CHOICES )),
#             # This maintains the 2-tuple requirement of a Select widget
#             # Grabs the route.pk and route.route_name (same thing) and stores the latter as options in the select
#         }

# ===========================
# USER LOGIN AND REGISTRATION
# ===========================

from django.contrib.auth.forms import UserCreationForm 
# ^ Handles things like making sure no duplicate usernames, that passwords are hashed etc
from django.contrib.auth.models import User 
# ^ Gives us access to Django's admin User group

class CreateUserForm(UserCreationForm): # Gonna be slightly customised version of UserCreationForm
    class Meta:
        model = User
        # Below gives us the same form as provided by UserCreationForm EXCEPT with the addition of 'email'
        fields = ['username', 'email', 'password1', 'password2']
        # RIGHT NOW, THE EMAIL USED FOR REGISTRATION DOES NOT HAVE TO BE UNIQUE!


from .models import AdditionalUserInfo
class AdditionalUserInfoForm(forms.ModelForm):
    class Meta:
        model = AdditionalUserInfo
        # widgets = {
        #     'leapcard_password': forms.PasswordInput(),
        # }
        # fields = ['leapcard_username', 'leapcard_password']
        fields = ['leapcard_username']
        # Updated fields:
        # fields = ['leapcard_username', 'height_in_cm', 'weight_in_kg']

from .models import FavouriteJourney
class FavouriteJourneyForm(forms.ModelForm):
    class Meta:
        model = FavouriteJourney
        fields = ['route_name', 'origin_stop', 'destination_stop', 'stops_count']

# ==================== Update User Credentials ====================
# Username and Email
class UpdateUserForm(forms.ModelForm):
    username = forms.CharField(required=False)
    class Meta:
        model = User
        fields = ['username', 'email']

# Leapcard Username
class UpdateLeapCardUsernameForm(forms.ModelForm):
    class Meta:
        model = AdditionalUserInfo
        fields = ['leapcard_username']