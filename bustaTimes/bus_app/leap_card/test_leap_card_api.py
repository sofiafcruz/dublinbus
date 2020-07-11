from pyleapcard import *
from pprint import pprint

def get_leap_card_details(username, password):

    session = LeapSession()
    session.try_login(username, password)

    overview = session.get_card_overview()
    pprint(vars(overview))

    return vars(overview)

