# https://www.youtube.com/watch?v=IKnp2ckuhzg&list=PLbpAWbHbi5rMF2j5n6imm0enrSD9eQUaM&index=4
from django.test import TestCase

from django.contrib.auth.models import User
from bus_app.models import AdditionalUserInfo, FavouriteJourney

from django.core.exceptions import ValidationError

# ==========
# User Model
# ==========

class UserModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        User.objects.create(
            username="James",
            password="dublinbus123",
            email="james@gmail.com",
            first_name="James",
            last_name="Wilson"
        )

    def test_duplicate_username_not_allowed(self):
        '''Test to make sure 2 users with the same username cannot be saved
        
        This means that a user cannot register an already-existing username
        '''
        # Attempt to create a copy
        with self.assertRaises(Exception):
            user_with_same_username = User.objects.create(
                username="James", # same username as existing user
                password="anotherPassword123",
                email="james123@gmail.com",
                first_name="Jimmy",
                last_name="Fallon"
            )
    
    def test_duplicate_email_is_allowed(self):
        '''Test to make sure 2 users with the same email can be saved
        
        This means that a user can register an already-existing email
        '''
        # Attempt to create a copy
        try:
            user_with_same_email = User.objects.create(
                username="Jimmy",
                password="anotherPassword123",
                email="james@gmail.com", # same email as existing user
                first_name="Jimmy",
                last_name="Fallon"
            )
        except Exception:
            self.fail("User should be able to have same email as another, but exception raised unexpectedly!")

# ==========================
# Additional User Info Model
# ==========================

class AdditionalUserInfoModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        User.objects.create(
            username="James",
            password="dublinbus123",
            email="james@gmail.com",
            first_name="James",
            last_name="Wilson"
        )

        AdditionalUserInfo.objects.create(
            user=User.objects.get(id=1),
            leapcard_username="James_Leap",
        )

    def test_leapcard_username_matches_users_leapcard_username(self):
        the_user = User.objects.get(id=1)
        the_users_leapcard_username = the_user.additionaluserinfo.leapcard_username
        self.assertEquals(the_users_leapcard_username, AdditionalUserInfo.objects.get(user_id=1).leapcard_username)
    
    def test_leapcard_username_max_length(self):
        the_user = User.objects.get(id=1)
        the_users_additional_info = the_user.additionaluserinfo
        max_length = the_users_additional_info._meta.get_field('leapcard_username').max_length
        self.assertEquals(max_length, 50)
    
    def test_additional_user_info_string_representation(self):
        the_user = User.objects.get(id=1)
        the_users_additional_info = the_user.additionaluserinfo
        expected_object_name = f'{the_user.username} with additional info: {the_users_additional_info.leapcard_username}'
        self.assertEquals(expected_object_name, str(the_users_additional_info))

# =======================
# Favourite Journey Model
# =======================

class FavouriteJourneyModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Set up non-modified objects used by all test methods
        User.objects.create(
            username="James",
            password="dublinbus123",
            email="james@gmail.com",
            first_name="James",
            last_name="Wilson"
        )

        FavouriteJourney.objects.create(
            route_name="102",
            origin_stop='7348, Dublin Airport, Terminals 1 and 2 (7348)',
            destination_stop='6033, Rathingle Road, Forest Road (6033)',
            stops_count=6,
            save_date="2020-08-03 15:35:07.482653+00:00",
            user=User.objects.get(id=1)
        )

    def test_users_favourite_journey_matches_first_favourite_journey(self):
        '''Make sure that the user's favourite journey and the only favourite journey instance are the same'''
        the_user = User.objects.get(id=1)
        the_users_first_favourite_journey = the_user.favouritejourney_set.get(id=1)
        first_favourite_journey = FavouriteJourney.objects.get(id=1)
        self.assertEquals(the_users_first_favourite_journey, first_favourite_journey)
    
    # TESTING FIELD MAX_LENGTHS
    def test_route_name_max_length(self):
        favourite_journey = FavouriteJourney.objects.get(id=1)
        max_length = favourite_journey._meta.get_field('route_name').max_length
        self.assertEquals(max_length, 10)
    
    def test_origin_stop_max_length(self):
        favourite_journey = FavouriteJourney.objects.get(id=1)
        max_length = favourite_journey._meta.get_field('origin_stop').max_length
        self.assertEquals(max_length, 200)
    
    def test_destination_stop_max_length(self):
        favourite_journey = FavouriteJourney.objects.get(id=1)
        max_length = favourite_journey._meta.get_field('destination_stop').max_length
        self.assertEquals(max_length, 200)
    
    # TESTING FIELDS THAT ARE UNIQUE_TOGETHER
    def test_unique_together(self):
        '''Test to make sure a user cannot have 2 copies of the same route
        
        The constraint set is that: route_name, origin_stop and destination_stop combined
        can NOT be the same as another entry
        '''
        # Attempt to create a copy
        with self.assertRaises(Exception):
            original_clone = FavouriteJourney.objects.create(
                route_name="102",
                origin_stop='7348, Dublin Airport, Terminals 1 and 2 (7348)',
                destination_stop='6033, Rathingle Road, Forest Road (6033)',
                stops_count=6,
                save_date="2020-08-03 15:35:07.482653+00:00",
                user=User.objects.get(id=1)
            )