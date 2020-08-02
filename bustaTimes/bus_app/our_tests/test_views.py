# https://www.youtube.com/watch?v=hA_VxnxCHbo&list=PLbpAWbHbi5rMF2j5n6imm0enrSD9eQUaM&index=3
from django.test import TestCase, Client
from django.urls import reverse, resolve

from bus_app.views import index, make_rpti_realtime_api_request, registerUserPopup, loginUserPopup, save_route_journey, showFavouritesPopup, delete_favourite_journey
from bus_app.models import AdditionalUserInfo, FavouriteJourney

import json

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

class TestStatuses(TestCase):
    # ===================
    # RESOLVING STATUSES;
    # ===================

    def setUp(self):
        self.client = Client()

    # 1.
    def test_index_status(self):
        url = reverse("index") # i.e. because 'index' name of the url: path('', views.index, name="index")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

class TestPostRequests(TestCase):
    pass
    # def test_