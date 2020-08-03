# https://www.youtube.com/watch?v=hA_VxnxCHbo&list=PLbpAWbHbi5rMF2j5n6imm0enrSD9eQUaM&index=3
from django.test import TestCase, Client
from django.urls import reverse, resolve

from bus_app.views import index, make_rpti_realtime_api_request, registerUserPopup, loginUserPopup, save_route_journey, delete_favourite_journey
from django.contrib.auth.models import User
from bus_app.models import AdditionalUserInfo, FavouriteJourney

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

        # URLS/Views:
        self.home_url = reverse("index") # i.e. because 'index' name of the url: path('', views.index, name="index") etc
        self.login_url = reverse("loginUserPopup")
        self.register_url = reverse("registerUserPopup")
        self.rpti_url = reverse("make_rpti_realtime_api_request")

    # =======
    # 1.index
    # =======

    def test_index_status(self):
        response = self.client.get(self.home_url)
        # Ensure status is OK
        self.assertEqual(response.status_code, 200)

    # =================================
    # 2. make_rpti_realtime_api_request
    # =================================

    def test_make_rpti_realtime_api_request_GET(self):
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
        # Make sure user is NOT logged in!!
        self.assertFalse(response.context['user'].is_authenticated)
        # Ensure the template returned is the home page (base.html)
        self.assertTemplateUsed(response, 'base.html')

    # NOT WORKING???
    def test_registerUserPopup_POST_is_unsuccessful(self):
        # Send registration data
        response = self.client.post(self.register_url, self.unsuccessful_register_credentials, follow=True)
        # Ensure status is OK
        self.assertEquals(response.status_code, 200)
        # Make sure user is NOT logged in!!
        self.assertFalse(response.context['user'].is_authenticated)
        # Ensure the template returned is the home page (base.html)
        self.assertTemplateUsed(response, 'base.html')

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
        # Ensure the template returned is the home page (base.html)
        self.assertTemplateUsed(response, 'base.html')
    
    def test_loginUserPopup_POST_registered_user(self):
        # Send login data
        response = self.client.post(self.login_url, self.saved_login_credentials, follow=True)
        # Login Should be successful...
        # Ensure status is OK
        self.assertEquals(response.status_code, 200)
        # Make sure user IS logged in
        self.assertTrue(response.context['user'].is_authenticated)
        # Ensure the template returned is the home page (base.html)
        self.assertTemplateUsed(response, 'base.html')

    # =====================
    # 5. save_route_journey
    # =====================
    
    # ===========================
    # 6. delete_favourite_journey
    # ===========================