# https://www.youtube.com/watch?v=zUl-Tf-UEzw&list=PLbpAWbHbi5rMF2j5n6imm0enrSD9eQUaM&index=5
from django.test import TestCase
from bus_app.forms import CreateUserForm, AdditionalUserInfoForm, FavouriteJourneyForm, UpdateUserForm, UpdateLeapCardUsernameForm

class TestForms(TestCase):
    # ==============
    # CreateUserForm
    # ==============
    def test_create_user_form_valid_data(self):
        form = CreateUserForm(data={
            "username": "test_username",
            "email": "test@gmail.com",
            "password1": "test_password",
            "password2": "test_password",
        })

        self.assertTrue(form.is_valid())
    
    def test_create_user_form_no_data_is_invalid(self):
        form = CreateUserForm(data={})

        self.assertFalse(form.is_valid())
        print("\n\n\n")
        print(form.errors) # For some reason doesn't say that email is required???
        print("\n\n\n")
        self.assertEquals(len(form.errors), 3) # But surely email should be part of the required fields, so length should be 4???

    # ======================
    # AdditionalUserInfoForm
    # ======================
    def test_additional_user_form_valid_data(self):
        form = AdditionalUserInfoForm(data={
            "leapcard_username": "test_username",
        })

        self.assertTrue(form.is_valid())
    
    def test_additional_user_form_no_data_is_also_valid(self):
        form = AdditionalUserInfoForm(data={})

        self.assertTrue(form.is_valid())
        self.assertEquals(len(form.errors), 0)

    # =====================
    # FavouriteJourneyForm
    # =====================
    def test_favourite_journey_form_valid_data(self):
        form = FavouriteJourneyForm(data={
            'route_name': 'test', 
            'origin_stop': 'test_origin_stop',
            'destination_stop': 'test_destination_stop',
            'stops_count': 1
        })
        print(form.errors)
        self.assertTrue(form.is_valid())
    
    def test_favourite_journey_form_no_data_is_invalid(self):
        form = FavouriteJourneyForm(data={})

        self.assertFalse(form.is_valid())
        print("\n\n\n")
        print(form.errors)
        print("\n\n\n")
        self.assertEquals(len(form.errors), 4)
    
    # ==============
    # UpdateUserForm
    # ==============

    # ==========================
    # UpdateLeapCardUsernameForm
    # ==========================