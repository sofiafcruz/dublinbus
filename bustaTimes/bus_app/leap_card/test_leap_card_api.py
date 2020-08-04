from pyleapcard import *
from pprint import pprint

def get_leap_card_details(username, password):
    print("Test 1")
    session = LeapSession()
    print("Test 2")
    session.try_login(username, password)

    print("Test 3")
    overview = session.get_card_overview()
    pprint(vars(overview))

    print("Test 4")
    return vars(overview)

