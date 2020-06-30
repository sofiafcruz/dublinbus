# Required so clicking dropdown options triggers corresponding info pull from DB
from django import forms
from .models import Route

class RouteForm(forms.Form):
    select_form = forms.ModelChoiceField(queryset=Route.objects.all(),
                                        widget=forms.Select(attrs={'class':'drop-down-list'}))

# Using a model form instead...
# https://stackoverflow.com/questions/5104277/field-choices-as-queryset
from django.forms.widgets import Select
class RouteModelForm(forms.ModelForm):
    class Meta:
        CHOICES = Route.objects.all()

        model = Route
        fields = ['route_name']
        widgets = {
            'route_name': Select(choices=((route.pk, route.route_name) for route in CHOICES )),
            # This maintains the 2-tuple requirement of a Select widget
            # Grabs the route.pk and route.route_name (same thing) and stores the latter as options in the select
        }