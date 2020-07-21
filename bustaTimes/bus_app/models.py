from django.db import models

# Create your models here.
# Class variables = Database fields
class BusStop(models.Model):
    stop_num = models.CharField(primary_key=True, max_length=20)
    address = models.CharField(max_length=100)
    latitude = models.CharField(max_length=100)
    longitude = models.CharField(max_length=100)

    def __str__(self):
        return self.stop_num

class Route(models.Model):
    route_name = models.CharField(primary_key=True, max_length=20) 
    origin = models.CharField(max_length=100)
    destination = models.CharField(max_length=100)
    bus_stops = models.ManyToManyField(BusStop, through='RouteAndStop') # A Route can have Many Bus Stops and a Bus Stop can be on Many Routes

    def __str__(self):
        return self.route_name

    def get_all_bus_stops(self):
        return self.bus_stops.all()

# Can we do the following below INSTEAD to represent this Many-To-Many relationship???
class RouteAndStop(models.Model):
    route_name = models.ForeignKey(Route, on_delete=models.CASCADE)
    stop_num = models.ForeignKey(BusStop, on_delete=models.CASCADE)
    prog_num = models.IntegerField()

# HOW WE CAN ACCESS ALL THE STOPS IN A ROUTE;
# ===========================================
# route_1 = Route.objects.get(pk=1)
# route_1.bus_stops.all()
# <QuerySet [<BusStop: 381>, <BusStop: 382>, <BusStop: 4451>, <BusStop: 383>, <BusStop: 384>, <BusStop: 385>, <BusStop: 387>, <BusStop: 388>, <BusStop: 389>, <BusStop: 393>, <BusStop: 371>, <BusStop: 391>, <BusStop: 392>, <BusStop: 395>, <BusStop: 396>, <BusStop: 397>, <BusStop: 398>, <BusStop: 399>, <BusStop: 400>, <BusStop: 319>, '...(remaining elements truncated)...']>
# len(route_1.bus_stops.all())
# 21

# ================================
# SUBSTITUTING A CUSTOM USER MODEL
# ================================
# If you’re starting a new project, it’s highly recommended to set up a custom user model, even if the default User model is sufficient for you. This model behaves identically to the default user model, but you’ll be able to customize it in the future if the need arises

# TUTORIAL VIDEO: https://www.youtube.com/watch?v=eCeRC7E8Z7Y

# from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
# # ^ AbstractBaseUser provides the core implementation of a user model, including hashed passwords and tokenized password resets. You must then provide some key implementation details:

# class CustomUserManager(BaseUserManager):
#     # Define what happens when a new User:
#     def create_user(self, email, username, password=None):
#         # We pass in the required fields as params here
#         if not email:
#             raise ValueError("Users must have an email address")
#         if not username:
#             raise ValueError("Users must have a username")
        
#         # Create the user
#         user = self.model(
#             email=self.normalize_email(email), # converts all the chars in the email to lower case
#             username=username,
#         )

#         user.set_password(password)
#         user.save(using=self._db)
#         return user
    
#     def create_superuser(self, email, username, password=None):
#         # Create the superuser
#         super_user = self.create_user(
#             email=self.normalize_email(email), # converts all the chars in the email to lower case
#             username=username,
#             password=password,
#         )

#         # Set the permissions of a superuser to True
#         super_user.is_admin = True
#         super_user.is_staff = True
#         super_user.is_superuser = True

#         super_user.save(using=self._db)
#         return super_user

#     # and Superuser are created:
# class CustomUser(AbstractBaseUser):
#     email = models.EmailField(verbose_name="email", max_length=60, unique=True)
#     username = models.CharField(max_length=30, unique=True)
#     leapcard_username = models.CharField(max_length=50) # Won't be required (i.e. will be optional)
#     leapcard_password = models.CharField(max_length=50) # Won't be required (i.e. will be optional)
#     # Fields below are required for setting up custom user
#     date_joined = models.DateTimeField(verbose_name='date joined', auto_now_add=True)
#     last_login = models.DateTimeField(verbose_name='last login', auto_now_add=True)
#     is_admin = models.BooleanField(default=False)
#     is_active = models.BooleanField(default=True)
#     is_staff = models.BooleanField(default=False)
#     is_superuser = models.BooleanField(default=False)

#     # The credential you want the user to be able to login with
#     USERNAME_FIELD = 'email' # more likely that
#     # List of all fields that are required
#     REQUIRED_FIELDS = ['username']

#     objects = CustomUserManager()

#     def __str__(self):
#         return f"{self.email} ({self.username})"
    
#     # Below are required
#     # User has permission (e.g. to chnage things in the DB) if they are admin
#     def has_perm(self, perm, obj=None):
#         return self.is_admin # we defaulted this to false
    
#     def has_module_perms(self, app_label):
#         return True
    
# ===================================================================================

# TUTORIAL VIDEO: https://www.youtube.com/watch?v=Tja4I_rgspI
# We'll use a separate table to store the additional user info in a 1-to-1 relationship

from django.contrib.auth.models import User

class AdditionalUserInfo(models.Model):
    # 1-to-1 field used to extend the original Django User table BUT NOT modify it
    user = models.OneToOneField(User, on_delete=models.CASCADE) # Whenever we delete the user, also delete its additional info
    # Adding the fields of interest
    leapcard_username = models.CharField(max_length=50, blank=True) # Won't be required (i.e. will be optional)
    leapcard_password = models.CharField(max_length=50, blank=True) # Won't be required (i.e. will be optional)

    def __str__(self):
        return self.user.username

