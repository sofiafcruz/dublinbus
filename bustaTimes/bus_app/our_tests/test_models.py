# https://www.youtube.com/watch?v=IKnp2ckuhzg&list=PLbpAWbHbi5rMF2j5n6imm0enrSD9eQUaM&index=4
from django.test import TestCase

from django.contrib.auth.models import User
from bus_app.models import AdditionalUserInfo, FavouriteJourney

from django.core.exceptions import ValidationError

# I DON'T THINK TestModels CLASS TEST WAS INFORMATIVE ENOUGH
# THEREFORE TRIED ANOTHER STRATEGY (BELOW TestModels)
# class TestModels(TestCase):

#     def setUp(self):
#         # User
#         self.user = User.objects.create_user(
#             username="James",
#             password="dublinbus123",
#             email="james@gmail.com",
#             first_name="James",
#             last_name="Wilson"
#         )
#         # Additional Info
#         self.additional_user_info = AdditionalUserInfo.objects.create(
#             user=self.user,
#             leapcard_username="James_Leap",
#         )
#         # Favourite Journey
#         self.favourite_journey = FavouriteJourney.objects.create(
#             route_name="102",
#             origin_stop='7348, Dublin Airport, Terminals 1 and 2 (7348)',
#             destination_stop='6033, Rathingle Road, Forest Road (6033)',
#             stops_count=6,
#             save_date="2020-08-03 15:35:07.482653+00:00",
#             user=self.user
#         )

#     def test_user_validations(self):
#         try:
#             self.user.full_clean()
#         except ValidationError as e:
#             # Do something based on the errors contained in e.message_dict.
#             # Display them to a user, or handle them programmatically.
#             print("Validation Error")
#             print(e)
    
#     def test_additional_info_validations(self):
#         # 1. leapcard_username max_length can't go above 50
#         print(self.additional_user_info.leapcard_username) # James_Leap (10 chars: fine)
        
#         # set the username to one that is higher than 50 (in this case 60 chars)
#         self.additional_user_info.leapcard_username = self.additional_user_info.leapcard_username * 6

#         try:
#             self.additional_user_info.full_clean()
#         except ValidationError as e:
#             # Do something based on the errors contained in e.message_dict.
#             # Display them to a user, or handle them programmatically.
#             print("Validation Error")
#             print(e)
    
#     def test_favourite_journey_validations(self):
#         # Check if validation errors arise (NONE expected)
#         try:
#             self.favourite_journey.full_clean()
#         except ValidationError as e:
#             # Do something based on the errors contained in e.message_dict.
#             # Display them to a user, or handle them programmatically.
#             print("Validation Error")
#             print(e)
        
#         # 1. route_name max_length can't go above 10
#         print(self.favourite_journey.route_name) # 102 (3 chars: fine)
        
#         # set the route_name to one that is higher than 10 (in this case 11 chars)
#         self.favourite_journey.route_name = '1' * 11
        
#         # 2. origin_stop max_length can't go above 200
#         print(self.favourite_journey.origin_stop) # (46 chars: fine)
        
#         # set the route_name to one that is higher than 10 (in this case 11 chars)
#         self.favourite_journey.origin_stop = 'X' * 201

#         # 3. destination_stop max_length can't go above 200
#         print(self.favourite_journey.destination_stop) # (40 chars: fine)

#         # 4. stops_count has to be a positive integer (NOT WORKING!)
#         # set the stops_count to a negative number
#         self.favourite_journey.stops_count = -201293123138

#         # 5. save_date can be blank (NOT SURE IF WORKING)
#         self.favourite_journey.save_date = None
#         # Check if validation errors arise (as expected)
#         try:
#             self.favourite_journey.full_clean()
#         except ValidationError as e:
#             # Do something based on the errors contained in e.message_dict.
#             # Display them to a user, or handle them programmatically.
#             print("Validation Error")
#             print(e)
    
#     # def test_printing_models(self):
#     #     # User
#     #     print(self.user)
#     #     print(self.user.username)
#     #     print(self.user.password)
#     #     print(self.user.email)
#     #     print(self.user.first_name)
#     #     print(self.user.last_name)
#     #     # Additional Info
#     #     print(self.additional_user_info)
#     #     print(self.additional_user_info.leapcard_username)
#     #     print(self.additional_user_info.leapcard_password)
#     #     # Favourite Journey
#     #     print(self.favourite_journey)
#     #     print(self.favourite_journey.save_date)

# ===============
# ACTUAL TESTING:
# ===============
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