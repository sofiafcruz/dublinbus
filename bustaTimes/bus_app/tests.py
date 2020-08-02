from django.test import TestCase, Client
# TestCase
# Client - acts as virtual user who is requesting web page and getting it returned to them

from django.urls import reverse
# reverse - allows us to do a 'reverse lookup' and use it on the 'names' of our urls in the urlpatterns list (in urls.py)

# Create your tests here.
class BusAppTest(TestCase):

    def setUp(self):
        self.client = Client()

    # Test our views below.
    # N.B. it's important all test cases begin with 'test_';

    def test_index_view(self):
        url = reverse("index") # i.e. because 'index' name of the url: path('', views.index, name="index")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)