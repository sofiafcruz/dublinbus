# https://www.youtube.com/watch?v=hA_VxnxCHbo&list=PLbpAWbHbi5rMF2j5n6imm0enrSD9eQUaM&index=3
from django.test import TestCase, Client
from django.urls import reverse, resolve

from bus_app.views import index, make_rpti_realtime_api_request, registerUserPopup, loginUserPopup, save_route_journey, showFavouritesPopup, delete_favourite_journey
from django.contrib.auth.models import User
from bus_app.models import AdditionalUserInfo, FavouriteJourney

# Views of Interest
# -----------------
# 1. index
# 2. make_rpti_realtime_api_request
# 3. registerUserPopup
# 4. loginUserPopup
# 5. save_route_journey
# 6. showFavouritesPopup
# 7. delete_favourite_journey

# N.B. it's important all test cases begin with 'test_';

class TestPostRequests(TestCase):
    
    # Setup
    def setUp(self):
        self.client = Client()
        # Bus Stop Number
        self.stop_num = {
            "inputStopNum": 905
        }
        # Login Credentials (SEEMS TO WORK EVEN THOUGH CREDENTIALS ARE WRONG???)
        self.login_credentials = {
            "username": "test_user",
            "password": "test_password" # Seems to pass, even is password is really bad/predictable...
        }
        User.objects.create_user(**self.login_credentials)
        # Sign Up/Register Credentials
        self.register_credentials = {
            # Required
            'username' : 'test_username',
            'email' : 'test_email@gmail.com',
            'password1' : 'test_password_1',
            'password2' : 'test_password_2',
            # Additional Info
            'leapcard_username' : 'test_leapcard_username',
            'leapcard_password' : 'test_leapcard_password'
        }

    # 1.
    def test_index_status(self):
        url = reverse("index") # i.e. because 'index' name of the url: path('', views.index, name="index")
        response = self.client.get(url)
        # Ensure status is OK
        self.assertEqual(response.status_code, 200)

    # 2.
    def test_make_rpti_realtime_api_request_GET(self):
        url = reverse("make_rpti_realtime_api_request") # i.e. because 'index' name of the url: path('', views.index, name="index")
        response = self.client.get(url, self.stop_num)
        # Ensure status is OK
        self.assertEqual(response.status_code, 200)

    # 3.
    def test_registerUserPopup_POST(self):
        url = reverse("registerUserPopup")
        # Send registration data
        response = self.client.post(url, self.register_credentials, follow=True)
        # Ensure status is OK
        self.assertEquals(response.status_code, 200)
        # Make sure user is NOT logged in!!
        self.assertFalse(response.context['user'].is_authenticated)
        # Ensure the template returned is the home page (base.html)
        self.assertTemplateUsed(response, 'base.html')

        # N.B. - From the view.py point of view, it seems to have failed? (i.e. ERROR IN REGISTERING THE USER WITH THE POPUP METHOD)
        # BUT it still passes the test case...?
        # Maybe I need to instantiate User and Additional Info to do this?????

    # 4. 
    def test_loginUserPopup_POST(self):
        url = reverse("loginUserPopup")
        # Send login data
        response = self.client.post(url, self.login_credentials, follow=True)
        # Login Should be successful...
        # Ensure status is OK
        self.assertEquals(response.status_code, 200)
        # Make sure user is logged in
        self.assertTrue(response.context['user'].is_authenticated)
        # Ensure the template returned is the home page (base.html)
        self.assertTemplateUsed(response, 'base.html')

    