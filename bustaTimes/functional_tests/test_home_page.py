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
        # Create Saved User for purposes of testing (saved to DB WITHIN CONTEXT OF TESTING! (i.e. not permanently))
        saved_user = User.objects.create_user(
            username="test_username",
            password="test_password",
        )
        # Create Unsaved User for purposes of testing
        # NOT WORKING AS I WAS HOPING!!! (E.G. CAN'T REGISTER THIS USER AS THEY 'Already exist')
        # unsaved_user = User.objects.create(
        #     username="unsaved_username",
        #     password="unsaved_password",
        #     email="unsaved_email@gmail.com",
        # )
        # Reset Password
        self.password_reset_href = '/password_reset/' # href of "Forgot password?" link
        self.password_reset_url = self.live_server_url + reverse('password_reset') # redirected password_reset page url

    # Close the browser after every test made
    def tearDown(self):
        self.browser.close()
    
    # setUp runs BEFORE any test function------------------------------------------
    # tearDown runs AFTER any test function----------------------------------------

    # =================
    # HELPER FUNCTIONS 
    # Functions used throughout the testing (used to maintain DRY principle)
    # =================

    def start_web_app(self):
        self.browser.get(self.live_server_url)
        # The user sees the home page as a general user

    def login_user(self, username="test_username", password="test_password"):
        # Click the login button, to show the login popup
        self.browser.find_element_by_id("login-option").click()
        # Find the login credential fields
        username_field = self.browser.find_element_by_id("login-username-field")
        password_field = self.browser.find_element_by_id("login-password-field")
        # Set the login credential fields to the credentials of a created user
        # NOT WORKING?
        # username_field.send_keys("selenium_test")
        # password_field.send_keys("dublinbus123")
        username_field.send_keys(username)
        password_field.send_keys(password)
        # Click login button
        self.browser.find_element_by_name('login').click()
        # The user now sees the home page as a logged in user (test_username)

    def register_user(self, username, password1, password2, email):
        # Click the login button, to show the login popup
        self.browser.find_element_by_id("register-option").click()
        # Find the login credential fields
        username_field = self.browser.find_element_by_id("register-username-field")
        password_field = self.browser.find_element_by_id("register-password-field")
        confirm_password_field = self.browser.find_element_by_id("register-confirm-password-field")
        email_field = self.browser.find_element_by_id("register-email-field")
        
        # Set the register credential fields to the credentials of a non-existing user
        username_field.send_keys(username)
        password_field.send_keys(password1)
        confirm_password_field.send_keys(password2)
        email_field.send_keys(email)
        # Click Register button
        self.browser.find_element_by_name('register-account').click()
        # The user now sees the home page as a logged in user (test_username)
    
    def can_see_login_link(self):
        # Ensure a user CAN see "login" option on nav bar
        alert_login = self.browser.find_element_by_id("login-option")
        self.assertEquals(alert_login.text, "Login")
    
    def can_see_logout_link(self):
        # Ensure a user CAN see "login" option on nav bar
        alert_login = self.browser.find_element_by_id("logout-option")
        self.assertEquals(alert_login.text, "Logout")
    
    def click_forgot_password_link(self):
        # Click the "Login" link on home page
        self.browser.find_element_by_id("login-option").click()
        # Click the "Forgot password?" link
        self.browser.find_element_by_xpath(f'//a[@href="{self.password_reset_href}"]').click()
    
    def determine_alert_notification_colour(self):
        '''Determine and return rgba value of notification banner
        
        error-background-color (red) = "rgba(248, 215, 218, 1)"
        success-background-color (green) = "rgba(212, 237, 218, 1)"
        '''
        
        # Find the alert notifcation message
        alert_notification = self.browser.find_element_by_class_name('alert')
        # determine it's background colour
        background_color = alert_notification.value_of_css_property("background-color")
        
        return background_color

    def is_a_success_notification(self, color):
        if color == "rgba(212, 237, 218, 1)":
            return True
        elif color == "rgba(248, 215, 218, 1)":
            return False
        else:
            return "SOMETHING WRONG!"

    # ===================
    # TEST CASE FUNCTIONS 
    # ===================
    
    # # =================================================================================================================================
    # def test_users_not_logged_in(self):
    #     '''Ensure when a user requests the page for the first time, they're not logged into an account'''
    #     # Start up the web app
    #     self.start_web_app()    
    #     # Ensure a user CAN see "login" option on nav bar
    #     self.can_see_login_link()

    #     # And we want finding the logout element to fail (but not sure how to test...);
    #     # alert_logout = self.browser.find_element_by_id("logout-option") # selenium.common.exceptions.NoSuchElementException: Message: no such element: Unable to locate element: {"method":"css selector","selector":"[id="logout-option"]"}
    #     # self.assertEquals(alert_logout.text, "Logout")

    # # =================================================================================================================================
    # def test_user_can_login_to_existing_account(self):
    #     '''Ensure when a user requests the page for the first time, they can log into an already-existing account'''
    #     # Start up the web app
    #     self.start_web_app()
    #     # Login with already-existing user credentials
    #     self.login_user("test_username", "test_password")

    #     # The user sees the home page as a logged in user (test_username)
    #     # Ensure the user can now see "logout" option on nav bar
    #     self.can_see_logout_link()

    # # =================================================================================================================================
    # def test_user_cannot_login_to_non_existing_account(self):
    #     '''Ensure when a user requests the page for the first time, they cannot log into a non-existing account'''
    #     # Start up the web app
    #     self.start_web_app()
    #     self.login_user("unregistered_username", "unregistered_password")

    #     # The user sees the home page STILL as a general user (as login would've failed)
    #     # Ensure the user can still see "login" option on nav bar
    #     self.can_see_login_link()
    
    # # =================================================================================================================================
    # def test_user_is_redirected_to_reset_password_page(self):
    #     '''Ensure when a user requests the page as a general user, they can be redirected to the reset password page'''
    #     # Start up the web app
    #     self.start_web_app()
    #     # The user sees the home page as a general user

    #     self.click_forgot_password_link()

    #     # Test that the current url matches the redirected page url
    #     self.assertEquals(self.browser.current_url, self.password_reset_url)

    # # =================================================================================================================================
    # def test_logged_in_users_name_matches_name_displayed_in_greeting_banner(self):
    #     '''Ensure that when a user logs in, their name in the greeting banner matches their login username'''
    #     # Start up the web app
    #     self.start_web_app()
    #     # Login as existing user
    #     self.login_user("test_username", "test_password")

    #     # The user sees the home page as a logged in user (test_user)
    #     greeting_banner = self.browser.find_element_by_id("greeting-banner")
    #     username_portion = greeting_banner.text.split()[-1]

    #     self.assertEquals(username_portion, "test_username")

    # # =================================================================================================================================
    # def test_user_can_register_nonexisting_account(self):
    #     '''Ensure when a user requests the page for the first time, they can register a new account'''
    #     # Start up the web app
    #     self.start_web_app()
    #     # Register as non-existing user
    #     # self.register_user("unsaved_username", "unsaved_password", "unsaved_password", "unsaved_email@gmail.com")
    #     self.register_user("unsaved_username2", "test_password2", "test_password2", "unsaved_email2@gmail.com")

    #     # Assert that notification message background-color is green (to show success)
    #     # Extract the background colour of the notifcation banner
    #     color = self.determine_alert_notification_colour()
    #     # Assert that registration was a success
    #     self.assertTrue(self.is_a_success_notification(color))

    # # =================================================================================================================================
    # def test_user_cannot_register_existing_account(self):
    #     '''Ensure when a user requests the page for the first time, they cannot register an already-existing account'''
    #     # Start up the web app
    #     self.start_web_app()
    #     # Register as Existing user (should fail)
    #     self.register_user("test_username", "test_password", "test_password", "test_password@gmail.com")

    #     # Assert that notification message background-color is red (to show failure)
    #     # Extract the background colour of the notifcation banner
    #     color = self.determine_alert_notification_colour()
    #     # Assert that registration was a failure!
    #     self.assertFalse(self.is_a_success_notification(color))

    # # =================================================================================================================================
    
    