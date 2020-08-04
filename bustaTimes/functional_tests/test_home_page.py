from selenium import webdriver

from bus_app.models import *
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.urls import reverse
from django.contrib.auth.models import User
from bus_app.models import AdditionalUserInfo, FavouriteJourney

import time

class TestHomePage(StaticLiveServerTestCase):

    def setUp(self):
        self.browser = webdriver.Chrome('functional_tests/chromedriver') 
    
    # Close the browser after every test made
    def tearDown(self):
        self.browser.close()
    
    # setUp runs BEFORE any test function------------------------------------------
    # tearDown runs AFTER any test function----------------------------------------

    # def test_show_browser(self):
    #     self.browser.get(self.live_server_url)
    
    # def test_users_not_logged_in(self):
    #     '''Ensure when a user requests the page for the first time, they're not logged into an account'''

    #     self.browser.get(self.live_server_url)
        
        
    #     # Ensure a user CAN see "login" option on nav bar
    #     alert_login = self.browser.find_element_by_id("login-option")
    #     # print(alert_login)
    #     self.assertEquals(alert_login.text, "Login")
    #     # And we want finding the logout element to fail (but not sure how to test...);
    #     # alert_logout = self.browser.find_element_by_id("logout-option") # selenium.common.exceptions.NoSuchElementException: Message: no such element: Unable to locate element: {"method":"css selector","selector":"[id="logout-option"]"}
    #     # self.assertEquals(alert_logout.text, "Logout")
    
    # def test_user_can_register_account(self):
    #     pass

    def test_user_can_login_to_existing_account(self):
        # Create user for purposes of testing (saved to DB WITHIN CONTEXT OF TESTING! (i.e. not permanently))
        test_user = User.objects.create_user(
            username="test_user",
            password="test_password",
        )
        self.browser.get(self.live_server_url)
        # Click the login button, to show the login popup
        self.browser.find_element_by_id("login-option").click()
        # Grab the login credential fields
        username_field = self.browser.find_element_by_id("login-username-field")
        password_field = self.browser.find_element_by_id("login-password-field")
        # Set the login credential fields
        # NOT WORKING?
        # username_field.send_keys("selenium_test")
        # password_field.send_keys("dublinbus123")
        # Click login button
        username_field.send_keys("test_user")
        password_field.send_keys("test_password")
        self.browser.find_element_by_name('login').click()

        time.sleep(10)