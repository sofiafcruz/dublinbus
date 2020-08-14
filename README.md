# Busta Times

<img src="bustaTimes/bus_app/static/images/logo.png" alt="Busta Times Logo" width="50%">
## About

### The Problem
Bus companies produce schedules which contain generic travel times. For example, in the Dublin Bus Schedule, the estimated travel time from Dun Laoghaire to the Phoenix Park is approximately 61 minutes.
Of course, there are many variables which determine how long the actual journey will take. Traffic conditions which are affected by the time of day, the day of the week, the month of the year and the weather play an important role in determining how long the journey will take. These factors along with the dynamic nature of the events on the road network make it difficult to efficiently plan trips on public transport modes which interact with other traffic.

### Our Solution
Based on data analysis of historic Dublin Bus data, we have created an application which when presented with any bus route, an origin stop and a destination stop, a time, a day of the week and the weather for that time, produces and displays an accurate estimate of travel time for the selected journey. Users can interact with the system via a web-based interface which is optimised for mobile devices. 

### Project Status
This application was built as part of the 2020 Summer Project designed by University College Dublin for students of their CS conversion masters course. Maintenance of this project will slow down for the remainder of the course to allow the contributors to focus on their studies. We encourage prospective users to contribute and maintain code as they wish, as well as fork the repository for understanding and experimentation.

## Built With
- Django
- Python 3
- HTML5
- CSS3
- JavaScript
- AJAX
- JQuery

## Overview
- We, as University College Dublin Computer Science Conversion Masters students, were provided with historical Dublin Bus data (2018) which was explored, cleaned and modelled in line with CRISP-DM methodology.
- Historical data was scraped from Dark Sky API and Met Eireann. Forecasted weather data was scraped from the Dark Sky weather API to embed in the predictive models.
- Prediction models were then generated from each bus trip by combining both bus and corresponding weather data.
- A single page application was built to host these predictions with a seamless user experience in mind. The responsive web design was applied to this app, in order to provide the best user experience for different devices. The application is composed of two main components: The Map component (where journeys, bus markers etc are rendered) and a Query Component (Menu Container) that stores the main features of the application. The main features are described in more detail below.

## Main Features
### Search by Location

Users can plan journeys by inputting desired origin and destination points. The journey of interest as recommended by Google maps is rendered on screen and accompanied by a timeline designed by us.

### Search by Route

Users can select specific bus routes and filter their journey as needed. The journey of interest is rendered on screen, and a prediction of the total trip time is displayed.

### Search by Bus Stop

Users can search a specific bus stop (filtered using Regex). And be shown all the routes that bus stop services on the map to give users an idea if a given bus served by the bus stop travels to a location of interest to the user (e.g. does bus stop X serve any bus routes that go into Dublin City Centre).

### Check Leap Card Balance

Users can check their leap card balance if they are registered with leap card by supplying valid credentials (username and password) to this section.

## Sub Features
### News Feed Info Bar

The news bar displays the latest news headlines from the Dublin Bus News Centre as well as its last updated date. By clicking the news headline, users will be redirected to the official website of Dublin Bus, displaying the full text of the news article.

### Dublin Tourist Attractions

Users can toggle the display of the thirty most popular attractions in Dublin, as determined by Tripadvisor. Users can also set directions to a given attraction from the origin they set.

### Night Mode

Users can toggle the map display between day and night mode.

### User Registration

Users can register with the application to access exclusive features, such as the ability to save their leap card username in the Check Leap Card Balance feature, as well as save their favourite journeys from the Search by Route feature.

### Favourite Journey

Logged in users have the ability to save their favourite journeys, so they don’t have to go through the same process to generate the journey every time.

### Estimated Fare Calculator

When users select a journey in the Search by Route feature, estimated journey prices for both cash and leap card are displayed in tabular format. 

### Real Time Bus Information

Users can consult the next coming buses for a given bus stop by clicking on the relevant bus stop marker.


## Prerequisites
### Git
Used to clone the repository containing the project.

### Anaconda
Anaconda is a free, open-source distribution of Python used to simplify package and virtual environment management and organisation required for the application.

### Pip
Pip is a package-management system used to install and manage packages written in python. It is used to install the relevant libraries required for the application to run.

### Environment Variables
The google maps key should be enabled for the following APIs: maps JavaScript, directions, places and geocoding.

`GOOGLEMAPS_KEY=YOUR_KEY`

`SECRET_KEY=YOUR_ENV_VAR`

`DARKSKY_KEY=YOUR_KEY`

`DJANGO_SETTINGS_MODULE=YOUR_ENV_VAR`

For production-only, the following environment variables are required:

For the PostgreSQL Database:

`DB_NAME=YOUR_ENV_VAR`

`DB_USER=YOUR_ENV_VAR`

`DB_PASS=YOUR_ENV_VAR`

For sending Emails for password reset:

`EMAIL_USER=YOUR_ENV_VAR`

`EMAIL_PASS=YOUR_ENV_VAR`

## API Reference
[Dark Sky](https://darksky.net/dev/docs)

[Google Maps](https://developers.google.com/maps/documentation/javascript/overview)

[Google Directions](https://developers.google.com/maps/documentation/directions/overview)

[Google Places](https://developers.google.com/places/web-service/overview)

[Google Geocoding](https://developers.google.com/maps/documentation/geocoding/overview)

[Leap Card](https://github.com/skhg/pyleapcard)

[RTPI](https://data.smartdublin.ie/dataset/c9df9a0b-d17a-40ff-a5d4-01da0cf08617/resource/4b9f2c4f-6bf5-4958-a43a-f12dab04cf61/download/rtpirestapispecification.pdf)

[GTFS - Timetable and stop name info](https://www.transportforireland.ie/transitData/PT_Data.html)




## Installation
Clone the git repository 

`git clone https://github.com/sofiafcruz/dublinbus.git`

Create a virtual environment using conda (recommended)

`conda create -n BustaTimes python=3.8`

Activate the virtual environment created in the previous step (recommended)

`conda activate BustaTimes`

Install the required Python libraries

`pip install -r requirements`

## Running the Application
Verify the development server is working

`cd ~/dublinbus/bustaTimes`

`python manage.py runserver`

Database Setup to create all required database tables

`python manage.py migrate #creates all necessary database tables`

`python manage.py makemigrations #store all databases created and edited`


Now run the server again and enter the URL (http://127.0.0.1:8000/) into a browser URL bar. You should see the web app render in front of your eyes!

## Tests
All our written test cases pass.

To run tests, cd into the main project directory containing manage.py and run the following:

For Functional Testing:

`python manage.py test functional_tests`

For Backend Testing (Views, Models etc):

`python manage.py test bus_app`

## Contributors/Collaborators
- Conor Ginty (Coordination Lead)
- Sofia Cruz (Customer Lead)
- Niall Delahunty (Code Lead)
- Boheng Ding (Maintenance Lead)

## Acknowledgements
We would also like to thank Dr. Gavin McArdle, Asst Prof. Soumyabrata Dev, Prof. Pádraig Cunningham and Dr. Félix Balado.

We would also like to thank Dublin Bus for providing the historical dataset on which our models were trained.
