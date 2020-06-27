# Required so clicking dropdown options triggers corresponding info pull from DB
from django import forms
from .models import Route

class RouteForm(forms.Form):
    select_form = forms.ModelChoiceField(queryset=Route.objects.all())