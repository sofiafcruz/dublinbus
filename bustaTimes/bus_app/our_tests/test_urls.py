# https://www.youtube.com/watch?v=0MrgsYswT1c&list=PLbpAWbHbi5rMF2j5n6imm0enrSD9eQUaM&index=2
from django.test import SimpleTestCase
from django.urls import reverse, resolve

from bus_app.views import index, make_rpti_realtime_api_request, registerUserPopup, loginUserPopup, save_route_journey, showFavouritesPopup, delete_favourite_journey

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

class TestURLs(SimpleTestCase):
    # ================
    # RESOLVING PATHS;
    # ================
    # We want the path with the name of the url (e.g. 'index') in urlpatterns resolves to the correct view

    # 1.
    def test_index_url_resolves(self):
        url = reverse("index")
        # Now we can use the resolve function to pass in a URL and see which view django will call
        # print(resolve(url)) # ResolverMatch(func=bus_app.views.index, args=(), kwargs={}, url_name=index, app_names=[], namespaces=[], route=)
        self.assertEquals(resolve(url).func, index)
    
    # 2.
    def test_make_rpti_realtime_api_request_url_resolves(self):
        url = reverse("make_rpti_realtime_api_request")
        # Now we can use the resolve function to pass in a URL and see which view django will call
        # print(resolve(url)) # ResolverMatch(func=bus_app.views.index, args=(), kwargs={}, url_name=index, app_names=[], namespaces=[], route=)
        self.assertEquals(resolve(url).func, make_rpti_realtime_api_request)
    
    # 7.
    def test_delete_favourite_journey_url_resolves(self):
        url = reverse("delete_favourite_journey", args=[1])
        # Now we can use the resolve function to pass in a URL and see which view django will call
        # print(resolve(url)) # ResolverMatch(func=bus_app.views.index, args=(), kwargs={}, url_name=index, app_names=[], namespaces=[], route=)
        self.assertEquals(resolve(url).func, delete_favourite_journey)