from selenium import webdriver

from bus_app.models import *
from django.contrib.staticfiles.testing import StaticLiveServerTestCase
from django.urls import reverse
import time

class TestHomePage(StaticLiveServerTestCase):
    
    # def test_foo(self):
    #     self.assertEquals(0, 1)

    def setUp(self):
        self.browser = webdriver.Chrome('functional_tests/chromedriver.exe')
    
    # Close the browser after every test made
    def tearDown(self):
        self.browser.close()
    
    # setUp runs BEFORE any test function
    # tearDown runs AFTER any test function

    def test_something(self):
        self.browser.get(self.live_server_url)
        time.sleep(10)