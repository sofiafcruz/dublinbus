# https://www.youtube.com/watch?v=hA_VxnxCHbo&list=PLbpAWbHbi5rMF2j5n6imm0enrSD9eQUaM&index=3
from django.test import TestCase, Client
# To validate our view behaviour we use the Django test Client. This class acts like a dummy web browser 
# that we can use to simulate GET and POST requests on a URL and observe the response. We can see almost 
# everything about the response, from low-level HTTP (result headers and status codes) through to the 
# template we're using to render the HTML and the context data we're passing to it. 

from django.urls import reverse, resolve

from bus_app.views import index, make_rpti_realtime_api_request, registerUserPopup, loginUserPopup, save_route_journey, delete_favourite_journey
from django.contrib.auth.models import User
from bus_app.models import AdditionalUserInfo, FavouriteJourney

import requests
import json
# Views of Interest
# -----------------
# 1. index
# 2. make_rpti_realtime_api_request
# 3. registerUserPopup
# 4. loginUserPopup
# 5. save_route_journey
# 6. delete_favourite_journey

# N.B. it's important all test cases begin with 'test_';

class TestViews(TestCase):
    
    # Setup: Define all the variables we use later
    def setUp(self):
        self.client = Client()
        # Bus Stop Number
        self.stop_num = {
            "inputStopNum": 905
        }
        # Login Credentials
        self.unsaved_login_credentials = {
            "username": "test_user_unsaved",
            "password": "test_password_unsaved"
        }
        # Create user instance that is NOT saved (in the context of testing)
        User.objects.create(**self.unsaved_login_credentials)
        self.saved_login_credentials = {
            "username": "test_user",
            "password": "test_password" 
        }
        # Create user instance that IS saved (in the context of testing)
        User.objects.create_user(**self.saved_login_credentials)

        # Sign Up/Register Credentials
        self.register_credentials = {
            # Required
            'username' : 'test_username',
            'email' : 'test_email@gmail.com',
            'password1' : 'test_password',
            'password2' : 'test_password',
            # Additional (Optional) Info
            'leapcard_username' : 'test_leapcard_username',
        }

        # Unsuccessful Sign Up/Register Credentials
        self.unsuccessful_register_credentials = {
            # Required
            'username' : 'marcia',
            'email' : 'marcia@gmail.com',
            'password1' : 'dublinbus123',
            'password2' : 'dublinbus123',
        }

        self.favourite_journey = {
            "route_name": "905_test",
            "origin_stop": "7348, Dublin Airport, Terminals 1 and 2 (7348)",
            "destination_stop": "6033, Rathingle Road, Forest Road (6033)",
            "stops_count": 6
        }
        
        # URLS/Views:
        self.home_url = reverse("index") # i.e. because 'index' name of the url: path('', views.index, name="index") etc
        self.login_url = reverse("loginUserPopup")
        self.register_url = reverse("registerUserPopup")
        self.rpti_url = reverse("make_rpti_realtime_api_request")
        self.save_route_journey_url = reverse("save_route_journey")
        # Not sure how to make the kwargs in the reversed url below dynamic?
        self.delete_favourite_journey_url = reverse("delete_favourite_journey", kwargs={'pk':1})

    # =======
    # 1.index
    # =======

    def test_index_url_accessible_by_name(self):
        response = self.client.get(self.home_url)
        # Ensure status is OK
        self.assertEqual(response.status_code, 200)
    
    def test_index_uses_correct_template(self):
        response = self.client.get(self.home_url)
        self.assertTemplateUsed(response, 'index.html')

    # =================================
    # 2. make_rpti_realtime_api_request
    # =================================

    def test_make_rpti_realtime_api_request_GET_status(self):
        response = self.client.get(self.rpti_url, self.stop_num)
        # Ensure status is OK
        self.assertEqual(response.status_code, 200)
    
    # ====================
    # 3. registerUserPopup
    # ====================

    def test_registerUserPopup_POST_is_successful(self):
        # Send registration data
        response = self.client.post(self.register_url, self.register_credentials, follow=True)
        # Ensure status is OK
        self.assertEquals(response.status_code, 200)
        # Make sure user is NOT logged in (as they are returned to home page and must login separately)
        self.assertFalse(response.context['user'].is_authenticated)
        # Ensure the template returned is the home page (index.html)
        self.assertTemplateUsed(response, 'index.html')

    def test_registerUserPopup_POST_is_unsuccessful(self):
        # Send registration data
        response = self.client.post(self.register_url, self.unsuccessful_register_credentials, follow=True)
        # Ensure status is OK
        self.assertEquals(response.status_code, 200)
        # Make sure user is NOT logged in!!
        self.assertFalse(response.context['user'].is_authenticated)
        # Ensure the template returned is the home page (index.html)
        self.assertTemplateUsed(response, 'index.html')

    # =================
    # 4. loginUserPopup
    # =================

    def test_loginUserPopup_POST_unregistered_user(self):
        # Send login data
        response = self.client.post(self.login_url, self.unsaved_login_credentials, follow=True)
        # Login Should be UN-successful...
        # Ensure status is 200 (as they would get returned to home page anyway)
        self.assertEquals(response.status_code, 200)
        # Make sure user is NOT logged in
        self.assertFalse(response.context['user'].is_authenticated)
        # Ensure the template returned is the home page (index.html)
        self.assertTemplateUsed(response, 'index.html')
    
    def test_loginUserPopup_POST_registered_user(self):
        # Send login data
        response = self.client.post(self.login_url, self.saved_login_credentials, follow=True)
        # Login Should be successful...
        # Ensure status is OK
        self.assertEquals(response.status_code, 200)
        # Make sure user IS logged in
        self.assertTrue(response.context['user'].is_authenticated)
        # Ensure the template returned is the home page (index.html)
        self.assertTemplateUsed(response, 'index.html')

    # =====================
    # 5. save_route_journey
    # =====================
    def test_save_route_journey_POST_saves_journey(self):
        # 1st ensure the route does NOT exist in DB
        self.assertFalse(FavouriteJourney.objects.filter(route_name='905_test').exists()) 
        
        # Login as user existing user
        login_response = self.client.post(self.login_url, self.saved_login_credentials, follow=True)
        # Login Should be successful...
        # Now try saving a journey
        save_journey_response = self.client.post(self.save_route_journey_url, self.favourite_journey)
        
        # Now test that the route DOES exist
        self.assertTrue(FavouriteJourney.objects.filter(route_name='905_test').exists())

    def test_save_route_journey_POST_user_can_save_multiple_journeys_separately(self):
        # 1st ensure the route does NOT exist in DB
        self.assertFalse(FavouriteJourney.objects.filter(route_name='905_test').exists()) 
        
        # Login as user existing user
        login_response = self.client.post(self.login_url, self.saved_login_credentials, follow=True)
        # Login Should be successful...
        # Now try saving 1st journey
        save_journey_response_1 = self.client.post(self.save_route_journey_url, self.favourite_journey)
        # Now try saving a different journey
        # Update the name of the favourite journey to make it different from the first saved journey
        self.favourite_journey["route_name"] = "1234_test"
        save_journey_response_2 = self.client.post(self.save_route_journey_url, self.favourite_journey)

        # Now test that BOTH routes exist
        # 1st Route
        self.assertTrue(FavouriteJourney.objects.filter(route_name='905_test').exists())
        # 2nd Route
        self.assertTrue(FavouriteJourney.objects.filter(route_name='1234_test').exists())
        # Ensure DB has 2 favourite journey instances
        self.assertEquals(FavouriteJourney.objects.all().count(), 2)
    
    def test_save_route_journey_POST_user_cannot_save_same_journey_twice(self):
        # 1st ensure the route does NOT exist in DB
        self.assertFalse(FavouriteJourney.objects.filter(route_name='905_test').exists()) 
        
        # Login as user existing user
        login_response = self.client.post(self.login_url, self.saved_login_credentials, follow=True)
        # Login Should be successful...
        # Now try saving 1st journey
        save_journey_response_1 = self.client.post(self.save_route_journey_url, self.favourite_journey)
        # Now try saving exact same journey
        save_journey_response_2 = self.client.post(self.save_route_journey_url, self.favourite_journey)

        # Now test that the original route still exists
        # Route
        self.assertTrue(FavouriteJourney.objects.filter(route_name='905_test').exists())
        # Ensure DB only has 1 favourite journey instance (i.e. the duplicate didn't get saved)
        self.assertEquals(FavouriteJourney.objects.all().count(), 1)
    
    # ===========================
    # 6. delete_favourite_journey
    # ===========================
    def test_delete_favourite_journey_POST_deletes_journey(self):
        # 1st ensure the route does NOT exist in DB
        self.assertFalse(FavouriteJourney.objects.filter(route_name='905_test').exists()) 
        
        # Login as user existing user
        login_response = self.client.post(self.login_url, self.saved_login_credentials, follow=True)
        # Login Should be successful...
        # Now try saving a journey
        save_journey_response = self.client.post(self.save_route_journey_url, self.favourite_journey)
        
        # Now test that the route DOES exist
        self.assertTrue(FavouriteJourney.objects.filter(route_name='905_test').exists())
        
        # NOW try to delete the journey
        delete_journey_response = self.client.get(self.delete_favourite_journey_url)
        # Ensure the route no longer exists in DB
        self.assertFalse(FavouriteJourney.objects.filter(route_name='905_test').exists()) 