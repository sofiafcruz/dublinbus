# https://www.youtube.com/watch?v=IKnp2ckuhzg&list=PLbpAWbHbi5rMF2j5n6imm0enrSD9eQUaM&index=4
from django.test import TestCase

from django.contrib.auth.models import User
from bus_app.models import AdditionalUserInfo, FavouriteJourney

from django.core.exceptions import ValidationError

class TestModels(TestCase):

    def setUp(self):
        # User
        self.user = User.objects.create_user(
            username="James",
            password="dublinbus123",
            email="james@gmail.com",
            first_name="James",
            last_name="Wilson"
        )
        # Additional Info
        self.additional_user_info = AdditionalUserInfo.objects.create(
            user=self.user,
            leapcard_username="James_Leap",
            leapcard_password="James_Leap_Pass"
        )
        # Favourite Journey
        self.favourite_journey = FavouriteJourney.objects.create(
            route_name="102",
            origin_stop='7348, Dublin Airport, Terminals 1 and 2 (7348)',
            destination_stop='6033, Rathingle Road, Forest Road (6033)',
            stops_count=6,
            user=self.user
        )

    def test_user_validations(self):
        try:
            self.user.full_clean()
        except ValidationError as e:
            # Do something based on the errors contained in e.message_dict.
            # Display them to a user, or handle them programmatically.
            print("Validation Error")
            print(e)
    
    def test_additional_info_validations(self):
        # 1. leapcard_username max_length can't go above 50
        print(self.additional_user_info.leapcard_username) # James_Leap (10 chars: fine)
        
        # set the username to one that is higher than 50 (in this case 60 chars)
        self.additional_user_info.leapcard_username = self.additional_user_info.leapcard_username * 6

        try:
            self.additional_user_info.full_clean()
        except ValidationError as e:
            # Do something based on the errors contained in e.message_dict.
            # Display them to a user, or handle them programmatically.
            print("Validation Error")
            print(e)
    
    def test_favourite_journey_validations(self):
        # Check if validation errors arise (NONE expected)
        try:
            self.favourite_journey.full_clean()
        except ValidationError as e:
            # Do something based on the errors contained in e.message_dict.
            # Display them to a user, or handle them programmatically.
            print("Validation Error")
            print(e)
        
        # 1. route_name max_length can't go above 10
        print(self.favourite_journey.route_name) # 102 (3 chars: fine)
        
        # set the route_name to one that is higher than 10 (in this case 11 chars)
        self.favourite_journey.route_name = '1' * 11
        
        # 2. origin_stop max_length can't go above 200
        print(self.favourite_journey.origin_stop) # (46 chars: fine)
        
        # set the route_name to one that is higher than 10 (in this case 11 chars)
        self.favourite_journey.origin_stop = 'X' * 201

        # 3. destination_stop max_length can't go above 200
        print(self.favourite_journey.destination_stop) # (40 chars: fine)

        # 4. stops_count has to be a positive integer
        # set the stops_count to a negative number
        self.favourite_journey.stops_count = -2

        # Check if validation errors arise (as expected)
        try:
            self.favourite_journey.full_clean()
        except ValidationError as e:
            # Do something based on the errors contained in e.message_dict.
            # Display them to a user, or handle them programmatically.
            print("Validation Error")
            print(e)
    
    # def test_printing_models(self):
    #     # User
    #     print(self.user)
    #     print(self.user.username)
    #     print(self.user.password)
    #     print(self.user.email)
    #     print(self.user.first_name)
    #     print(self.user.last_name)
    #     # Additional Info
    #     print(self.additional_user_info)
    #     print(self.additional_user_info.leapcard_username)
    #     print(self.additional_user_info.leapcard_password)
    #     # Favourite Journey
    #     print(self.favourite_journey)
    #     print(self.favourite_journey.save_date)

