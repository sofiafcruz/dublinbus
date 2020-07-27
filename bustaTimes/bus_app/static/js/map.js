// **************** Change Map Style ****************
function changeMapStyle(json_filename) {
  // Onclick Event for Button to Toggle the Map Style Dynamically
  // Function used by a button elements
  $.ajax({
      url: './static/google_map_styles/' + json_filename + '.json', 
      async: false,
      dataType: 'json',
      success: function (json_style) {
        map.setOptions({styles: json_style});
      },
      error: function(error) { // An error most likely won't arise unless we mess with the JSON data or path
        console.log(`Error ${error}`);
      },
  });
}

// **************** Initialise many of the variables (to make them global and accessible by different functions that don't have scope on them) ****************
var map;
// Next 2 variables will be used to render directions;
var directionsService; 
var directionsDisplay; 
// Next 2 variables are to control window closure;
var lastOpenedInfoWindow; // Variable to keep track of the current opened info window
// Global Markers for hiding
var global_markers = [];
var markerCluster;
var journeyMarker;
var destinationMarker;

// Reads the local JSON file with the attractions info
var xmlhttp = new XMLHttpRequest(); // Initialise request object
var url = "./static/attractions.json";
var attractions = null;
xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      attractions = JSON.parse(xmlhttp.responseText);
    }
};
xmlhttp.open("GET", url, true);
xmlhttp.send();

// **************** Initialising the Map ****************
function initMap() {
  map = new google.maps.Map(document.getElementById('map'));
  
  // Disabling double-clicking zoom feature when setting a destination marker
  map.setOptions({disableDoubleClickZoom: true });
  
  // DESTINATION MARKER
  // Destination Marker icon (currently a bullseye - will be updated at some stage)
  var icon = {
    url: './static/images/target.png',
    scaledSize: new google.maps.Size(50, 50), 
    anchor: new google.maps.Point(12.5, 12.5) 
  };
  // Destination Marker
  destinationMarker = new google.maps.Marker({
    position: null, // Initially set to null (until map double clicked)
    map: map,
    icon: icon
  });

  // Add marker on DOUBLE click (Will be used later for adding origin and destination points)
  map.addListener('dblclick', function(e) {
    placeDestinationMarker(e.latLng, map, destinationMarker);
  });

  // For autocomplete on Home Search Boxes;
  // (Origin)
  origin_autocomplete = new google.maps.places.Autocomplete(
    document.getElementById("origin-home-search"),
    {
      componentRestrictions: {"country": ["IE"]},
      fields: ["place_id", "geometry", "name"]
    }
  );

  // (Destination)
  destination_autocomplete = new google.maps.places.Autocomplete(
    document.getElementById("destination-home-search"),
    {
      componentRestrictions: {"country": ["IE"]},
      fields: ["place_id", "geometry", "name"]
    }
  );

  // Single instances to be used for the directions (displaying journey and rendering)
  // 1. Initialise a Directions Service object (computes directions between 2 or more places by sending direction queries to Google's servers). 
  directionsService = new google.maps.DirectionsService();
  // 2. Instantiate a Directions Renderer object (Renders directions obtained from the DirectionsService.)
  directionsDisplay = new google.maps.DirectionsRenderer({
    preserveViewport: false
  });

  navigator.geolocation.getCurrentPosition(function(position) {
    // Center map on user's current location if geolocation prompt allowed
    var usersLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    map.setCenter(usersLocation);
    map.setZoom(15);

    // Characteristics of the icon for the user's location
    var icon = {
      url: './static/images/gps.svg',
      scaledSize: new google.maps.Size(30, 30), 
      anchor: new google.maps.Point(12.5, 12.5) 
    };
    // ------------CAN MARKER BE REMOVED, AS DOES NOT APPEAR TO BE BEING USED?
    var marker = new google.maps.Marker({
      position: usersLocation,
      map: map,
      icon: icon
    });
  }, function(positionError) {
    // Default to Dublin if user denied geolocation prompt
    setMapDublin();
  });

  // Characteristics of the icon for Bus Stops
  var busStopIcon = {
    url: './static/images/bus_stop_icon.svg',
    scaledSize: new google.maps.Size(25, 25), 
    anchor: new google.maps.Point(12.5, 12.5) 
  };

  // Loading the bus stops and adding them to the map
  // $.getJSON("./static/bus_stops.json", function(stops) {
  $.getJSON("./static/HD_stops_Frontend.json", function(stops) {
    // console.log(stops);
    var stop_properties = Object.values(stops);
    var markers = stop_properties.map(function(property, i) {
    // var markers = stops.map(function(property, i) {
      var stopCoords = new google.maps.LatLng(property.lat, property.long);
      // var stopCoords = new google.maps.LatLng(property.latitude, property.longitude);
      var marker = new google.maps.Marker({
        position: stopCoords,
        icon: busStopIcon,
        title: property.stop_num // Title is each marker's stop num (which we use to generate timetable data for the info window that is unique to each bus stop)
      });
      stopsInfowindow(marker);
      global_markers.push(marker);
      return marker;
    });
    // console.log(global_markers);

    // Add a marker clusterer to manage the markers.
    markerCluster = new MarkerClusterer(map, markers,
      {ignoreHidden: true,
        imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'}
    );
  });
}

// **************** Toggle Hide/Show all map markers (and clusters) ****************
// Calls another function to remove the markers from the map
function clearMarkers() {
  // console.log(global_markers[0]["visible"]);
  toggleMarkerVisibility(global_markers);
}

// Sets the map on all markers in the array.
function toggleMarkerVisibility(markersToHide) {
  // If the first marker in the array of markers is visible, then they are all visible
  if (markersToHide[0]["visible"]) {
    // Therefore, set each marker in the array's visibility to false
    for (var i = 0; i < markersToHide.length; i++) {
      markersToHide[i].setVisible(false);
    }
  } else {
    // else they're all not visible, so make them visible
    for (var i = 0; i < markersToHide.length; i++) {
      markersToHide[i].setVisible(true);
    }
  }
  markerCluster.repaint(); // Show OR Hide the Marker cluster (depending on whichever condition passed)
}

// Pan to User's Location
// Called with an onclick event
function panToUsersLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      let user_coords = position.coords;
      var userLatLng = new google.maps.LatLng(user_coords.latitude, user_coords.longitude);
      // console.log(userLatLng);
      // FOR SOME REASON WE CAN'T JUST RETURN THE USERS' LOCATION
      map.panTo(userLatLng);
    });
  } else { 
    alert("Geolocation is not supported or enabled.");
  }
}

// ================================ ATTRACTIONS ==============================================

// Array that will be used for the switch button that displays the attractions
// When the switch is off, it uses this array to remove the markers
var attractionsArray = []

// The switch button calls this function on change to display the attractions on the map
function displayAttractions() {
  setMapDublin(); // Center the map in Dublin
  // Check the value of the switch button
  var switchValue = document.getElementsByClassName("attractions-switch")[0].checked ? true : false
  if (switchValue) { 
    // Loop through the attractions in the JSON file and add marker for each to the map
    for (i = 0; i < attractions.length; i++) {
      var latitude = parseFloat(attractions[i].latitude);
      var longitude = parseFloat(attractions[i].longitude);
      var iconName = attractions[i].icon;
      var url = './static/images/attractions/' + iconName + '.svg';
      var icon = {
        url: url,
        scaledSize: new google.maps.Size(50, 50), 
        anchor: new google.maps.Point(20, 40) 
      };
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(latitude, longitude),
        title: attractions[i].title,
        map: map,
        icon: icon
      });
      // Add on click info windows to each attraction
      attractionsInfowindow(marker, attractions[i].title);
      
      attractionsArray.push(marker);
    };
  } else {
    // When switch is off, remove all the attraction makers from the map
    for (i = 0; i < attractionsArray.length; i++) {
      attractionsArray[i].setMap(null);
    };
  };
};

// Display info window for each attraction
function attractionsInfowindow (marker, title) {
  var infowindow = new google.maps.InfoWindow({
    maxWidth: 250
  });
  marker.addListener('click', function() {
    // Function to check whether there is an opened info window, if so closes it
    closeLastOpenedInfoWindow(lastOpenedInfoWindow);

    var summary, image, url, latitude, longitude;

    // Loop through the JSON file to get attractions information
    for (i = 0; i < attractions.length; i++) {
      if (title == attractions[i].title) {
        summary = attractions[i].summary;
        image = attractions[i].image;
        url = attractions[i].url;
        latitude = attractions[i].latitude;
        longitude = attractions[i].longitude;
      }
    }
    // Content to display in the info window
    var contentString = '<div class="attractions-infowindow">' +
    '<div class="attractions-content">'+
    '<h4 class="attractions-title">' + title + '</h4>'+
    '<a href="#" onclick="calcRouteToAttraction(' + latitude + ', ' + longitude + ')">Directions</a>'+
    '<div class="attractions-image"><img src="' + image + '" alt="' + title + '" style="max-width:250px; max-height:250px;"></div>' + 
    '<div id="attractions-bodyContent">'+
    '<p class="attractions-summary">' + summary + '&nbsp;<a href="' + url + '">More Info</a></p>'+
    '</div>'+
    '</div>';
    infowindow.setContent(contentString);
    infowindow.open(map, marker);
    lastOpenedInfoWindow = infowindow;

  });
}

function calcRouteToAttraction(latitude, longitude) {
  closeLastOpenedInfoWindow(lastOpenedInfoWindow);
  // set 'origin-home-search' to the User's current location
  getUsersLocation();
  // set 'destination-home-search' to the User's current location
  var geocoder = new google.maps.Geocoder();
  var latlng = { lat: latitude, lng: longitude };
  geocoder.geocode({ location: latlng }, function(results, status) {
    if (status === "OK") {
      if (results[0]) {
        // Set the value of geocodeLatLng to the inner HTML of destination
        document.getElementById("destination-home-search").value = results[0].formatted_address;
        // Click the submit button to show the journey/directions from the User's location to the attraction
        document.getElementById("home-submit").click();
      } else {
        window.alert("No results found");
      }
    } else {
      window.alert("Geocoder failed due to: " + status);
    }
  });
}

// ================================ OTHER ==============================================
function setMapDublin() {
  map.setCenter(new google.maps.LatLng(53.346, -6.26));
  map.setZoom(13);
}

// Close the previous info window when a new marker is clicked
// Both the attractions and the bus stops info windows are using this function
function closeLastOpenedInfoWindow(lastOpened) {
  if (lastOpened) {
    lastOpened.close();
  }
}

// ================================ DESTINATION MARKER ==============================================
// For setting destination marker (in Home tab):
function placeDestinationMarker(latLng, map, destMarker) {
  
  // Set the destination marker's coordinates to the selected
  destMarker.setPosition(latLng);

  // Reverse Geocode the Coordinates into the Place name, so that it can then be pasted into the "Destination" input text box
  var geocoder = new google.maps.Geocoder();
  // Window to show place name of the destination location that was selected (double-clicked)
  // Info window probably not important for Final Product 
  var infowindow = new google.maps.InfoWindow();

  // Function used to reverse Geocode the Coordinates into the Place name
  // Also sets the "Destination" value to the place name and sets the content of the destination marker's info window
  geocodeLatLng(latLng.lat(), latLng.lng(), geocoder, map, infowindow, destMarker);

}

// Converts the coordinate information of a double-clicked location on the map to its placename
function geocodeLatLng(latitude, longitude, geocoder, map, infowindow, marker) {
  var latlng = { lat: latitude, lng: longitude };
  geocoder.geocode({ location: latlng }, function(results, status) {
    if (status === "OK") {
      if (results[0]) {
        infowindow.setContent(results[0].formatted_address);
        // infowindow.open(map, marker); // Open the Destination marker info window
        // Set the value of geocodeLatLng to the inner HTML of destination
        document.getElementById("destination-home-search").value = results[0].formatted_address;
      } else {
        window.alert("No results found");
      }
    } else {
      window.alert("Geocoder failed due to: " + status);
    }
  });
}

// ================================ MARKER WINDOW REALTIME CONTENT ==============================================
// ************************ Used to make call to the backend to handle RPTI API request (as can't be done solely on frontend due to CORS security issues) ************************
function grabRealTimeContent(stopNum) {
  // Function takes in the clicked bus marker's stop number as a parameter, and feeds this into the backend to use as a parameter for the RPTI API call
  // API returns Realtime Bus info for a stop (e.g. )
  $.ajax({
      url: 'make_rpti_realtime_api_request', // Name of the function in views.py in the backend that requests the API
      async: false, // AJAX call needs to be asynchronous to make the result variable (on success) available to the 'stopsInfowindow' function
      type: 'GET', // We are making a GET request, as there is no security issues with the data we're retrieving
      data: {
        inputStopNum: stopNum // This is the data that is passed into by the backend via a GET request, which the backend can then use to make the relevant RPTI API call 
      },
      success: function(result) { // If the Request is successful (i.e. There was a request made in the backend that returned "something", BUT N.B. the response may return an EMPTY array, as no results were found)
        // 'result' is a JsonResponse object returned from the 'make_rpti_realtime_api_request' func in views.py (effectively a json-string). 
        console.log(result);
        // We must now parse the string into a JSON object here.
        parsed_realtime_info = JSON.parse(result) 
        console.log(parsed_realtime_info);
        // This 'parsed_realtime_info' variable is now available anywhere in the code (because the ajax function was NOT aynschronous)
      },
      error: function(error) { // An most likely won't arise unless the API goes down (Or perhaps is requested too many times?)
        console.log(`Error ${error}`)
      },
  });
}

// **************** Creates the content of the info window of the marker that is clicked to relevant real-time info generated on backend ****************
function setWindowContentHTML(objects, stopNum){
  // Function takes 2 parameters: 
  // 1. The array of objects (info about buses coming to the clicked bus stop)
  // 2. The number of the stop marker that is clicked.
  let outputHTML = "";
  // If the API call was successful, and we got an array of objects, then fill the info window content with the data
  if (objects.length > 0){
    for (i = 0; i < objects.length; i++){
      console.log(objects[i]);
      outputHTML += `
        <div id="marker-window-realtime-content">
          <h6>${objects[i]["route"]}</h6>
          <p><b>${objects[i]["origin"]}</b> to <b>${objects[i]["destination"]}</b></p>
          <p>Due: ${objects[i]["due"]}</p>
          <p>Scheduled Arrival: ${objects[i]["scheduled_arrival_datetime"]}</p>
          <p>Actual Arrival: ${objects[i]["arrival_datetime"]}</p>
          <hr>
        </div>
      `
    } // else, the API call didn't get any data, so we fill the info window with this info to inform the user of the same.
  } else {
    outputHTML = "No Information available for Stop: " + stopNum;
  }
  
  return outputHTML;
}

// **************** Sets the content of the info window of the marker that is clicked to relevant real-time info generated on backend ****************
function stopsInfowindow(marker) {
  var infowindow = new google.maps.InfoWindow();
  marker.addListener('click', function() {
    grabRealTimeContent(marker.title); // Makes a call to the RPTI API via the backend based on the stop number (marker.title)
    closeLastOpenedInfoWindow(lastOpenedInfoWindow);
    // console.log(parsed_realtime_info); // Shows the array of objects that is gotten from 'https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?type=day&stopid=' + BusStopNumber

    let realtime_content = setWindowContentHTML(parsed_realtime_info, marker.title);
    // Set Window to real-time info relevant to the clicked bus stop
    infowindow.setContent(realtime_content);
    
    infowindow.open(map, marker);
    lastOpenedInfoWindow = infowindow;
  })
}

// ================================ HOME ==============================================
// Display the user's location when switch button is on, clear the origin field when off
// Called when switch button changes
function fillUsersLocation() {
  // Check the value of the switch button
  var switchValue = document.getElementsByClassName("users-location-switch")[0].checked ? true : false
  // If switch button on
  if (switchValue) { 
    // Get User's current location and fill origin with it.
    getUsersLocation()
  } else {
    // Clear the origin field
    document.getElementById("origin-home-search").value = null;
  };
};

// Function to get User's Location
function getUsersLocation(){
  // If the user has enabled geolocation, then call a function that populates the "Origin" input with the user's location
  if (navigator.geolocation) {
    console.log(navigator.geolocation.getCurrentPosition(logSuccessAndPopulateOrigin));
  } else { 
    alert("Geolocation is not supported or enabled.");
  }
}

function logSuccessAndPopulateOrigin(pos) {
  // Populates the "Origin" input on Home screen with the user's position (text, NOT actual coordinates, so possibly not too accurate)
  var coordinates = pos.coords;

  console.log('Your current position is:');
  console.log(`Latitude : ${coordinates.latitude}`);
  console.log(`Longitude: ${coordinates.longitude}`);
  console.log(`More or less ${coordinates.accuracy} meters.`);

  // Reverse Geocode the Coordinates into the Place name, so that it can then be pasted into the "Origin" input text box
  var geocoder = new google.maps.Geocoder();

  var latlng = { lat: coordinates.latitude, lng: coordinates.longitude };
  geocoder.geocode({ location: latlng }, function(results, status) {
    if (status === "OK") {
      if (results[0]) {
        // Set the value of the user's coordinates to the inner HTML of "Origin" text input
        document.getElementById("origin-home-search").value = results[0].formatted_address;
      } else {
        alert("No location results found for the User's current location");
      }
    }
  });
}

// Render directions based on origin and destination (COORDINATES, NOT PLACE NAMES) on home tab;
const calculateAndRenderDirections = (origin, destination, directionsService, directionsDisplay) => {
  let request = {
    origin: origin,
    destination: destination,
    travelMode: 'TRANSIT' // Show how to get from A to B by bus (where posssible???)
  };

  directionsDisplay.setMap(map);
  // .route takes 2 parameters:
  // 1. a Directions Request
  // 2. a Callback function (which takes in the Result of the Directions Query and a status (to show if query to Google servers was successful))
  directionsService.route(request, (result, status) => {
    if (status == "OK") {
      // server request is OK, set the renderer to use the result to display the directions on the renderer's designated map and panel.
      directionsDisplay.setMap(map);
      directionsDisplay.setDirections(result);
    } else {
      alert("There was a problem with calculating your route");
    }
    
    // ************* Message Printout for users in Div (Directions, Instructions etc) *************
    let legs = result.routes[0].legs[0];
    let departure_time = legs.departure_time.text;
    let arrival_time = legs.arrival_time.text;
    let duration = legs.duration.text;
    let distance = legs.distance.text;

    let steps = legs.steps;

    journey_details_div = document.getElementById('journey-details')

    let today = new Date();
    let suffix = "am";
    let hours = today.getHours()
    // Logic to make Current time fit with 12-hour clock format of the Google Map's Service object (instead of 24 hour format)
    if (hours >= 12) {
      suffix = "pm";
      hours -= 12
    }
    // Creating 12-hour format for current time
    let current_time = hours + "." + today.getMinutes() + suffix;

    // Total Journey info (at the top of the div)
    journey_details_div.innerHTML = `
      <div>
        <h6>Total Journey Details</h6>
        <p>Current Time: ${current_time}</p>
        <p>Departure Time: ${departure_time}</p>
        <p>Arrival Time: ${arrival_time}</p>
        <p>Total Duration: ${duration}</p>
        <p>Total Distance: ${distance}</p>
        <h6>Details of Each Step:</h6>
      </div>
    `;

    // Add Button to "Exit" the journey
    journey_details_div.innerHTML += `
    <div>
      <button onclick="setJourneyToNull()">Exit Journey</button>
    </div>
    `

    // Subsequent info consists of the "Steps" that make up the total journey (e.g. Step 1, walk to X, Step 2. From X, get a bus to Y etc)
    steps.forEach(function (step, index) {
      journey_details_div.innerHTML += `
        <div>
          <b>Step: ${index+1} (${step.travel_mode} for ~${step.duration.text})</b>
          <p>${step.instructions}</p>
          <p>Distance: ${step.distance.text}</p>
        </div>
      `;
    });
    
    // Add container at the end with a directions panel
    journey_details_div.innerHTML += `<div id="directions-panel"></div>`;
    directionsDisplay.setPanel(document.getElementById("directions-panel"));

    // Add a class to the div containing the journey details to make it visible
    document.getElementById("journey-details").className = "journey-details";
  }); 
}

// ************************ "Exit" the journey generated in "Home" ************************
function setJourneyToNull(){
  // Remove the rendered Journey
  directionsDisplay.setMap(null);
  // Remove the Destination Marker
  destinationMarker.setPosition(null); // Not working (No scope on destination marker)
}
  

$("#home-submit").click(function(e) {
  // Disable submit button from reloading the page when clicked
  e.preventDefault();

  // Grab the values of the "Origin" and "Destination" input boxes
  // Maybe it's better to use Lat and Long coordinates to improve accuracy?
  var start = document.getElementById('origin-home-search').value; 
  var end = document.getElementById('destination-home-search').value;
  // If the user filled in both the Origin and Destination inputs correctly
  if (start.length > 0 && end.length > 0){
    calculateAndRenderDirections(start, end, directionsService, directionsDisplay);
  } else {
    // else, alert user with an appropriate error message
    // LOGIC HERE IS VERY BAD... CODE IS NOT DRY! NEED TO FIGURE OUT BETTER ALTERNATIVE
    let alert_message = "ERROR: Missing Details: ";

    let duration_of_error_class = 1500;

    if (start.length > 0) {
      alert_message += "Destination";
      alert(alert_message);
      // Add and remove error class to highlight problematic input for user
      $("#destination-home-search").addClass('error');
      setTimeout(function(){
        $("#destination-home-search").removeClass('error');
      }, duration_of_error_class);
    } else if (end.length > 0) {
      alert_message += "Origin";
      alert(alert_message);
      // Add and remove error class to highlight problematic input for user
      $("#origin-home-search").addClass('error');
      setTimeout(function(){
        $("#origin-home-search").removeClass('error');
      }, duration_of_error_class);
    } else {
      alert_message += "Origin and Destination";
      alert(alert_message);
      // Add and remove error class to highlight problematic input for user
      $("#origin-home-search").addClass('error');
      setTimeout(function(){
        $("#origin-home-search").removeClass('error');
      }, duration_of_error_class);
      $("#destination-home-search").addClass('error');
      setTimeout(function(){
        $("#destination-home-search").removeClass('error');
      }, duration_of_error_class);
    }
  }
  
});
// ================================ SEARCH BY ROUTE ==============================================

// ************************ CODE TO SET MAP TO WHATEVER JOURNEY IS SEARCHED in "Search By Route" (outside of init function) ************************
function showJourneyOnMap(arrOfSelectedStopObjs){
  // Function takes an array of selected Stop Objects (referring to all the stops from start stop A to ending stop B inclusive decided by the user)
  // This function is called by 'app.js', as app.js is where the array of selected routes is generated.
  var markersArray = []; // variable that will hold all the markers of the journey (should (hopefully) be cleared each time so old journeys are removed from map)
  console.log(markersArray);
  for (var i = 0; i < markersArray.length; i++) {
    markersArray[i].setMap(null);
  }

  for (var i = 0; i < arrOfSelectedStopObjs.length; i++) {
    let bus_stop_obj = arrOfSelectedStopObjs[i]; // Bus Stop object
    // let bus_stop_num = Object.keys(bus_stop_obj)[0]; // Bus Stop number
    let bus_stop_properties = Object.values(bus_stop_obj)[0]; // Properties of bus stop (prog num, lat, long, address)

    let bus_stop_lat = bus_stop_properties.latitude; // Bus Stop Latitude
    let bus_stop_long = bus_stop_properties.longitude; // Bus Stop Longitude

    let busLatLng = { lat: bus_stop_lat, lng: bus_stop_long }; // Bus Stop LatLng object

    var busStopIcon = { // WAS THINKING MAYBE WE SHOULD HAVE A DIFFERENT ICON HERE TO HIGHLIGHT THE STOPS OF THE JOURNEY
      url: './static/images/bus_stop_icon.svg',
      scaledSize: new google.maps.Size(25, 25), 
      anchor: new google.maps.Point(12.5, 12.5) 
    };
    // Create a marker of that lat and long
    journeyMarker = new google.maps.Marker({
      position: busLatLng,
      map: map,
      icon: busStopIcon
    });
    // Push each marker of the journey to the array
    markersArray.push(journeyMarker);

  }  
  // Calls the function to display the directions on the map
  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(document.getElementById("routes-directions-panel")); 

  // Add a class to the div containing the journey details to make it visible
  document.getElementById("routes-directions-panel").className = "journey-details";
  calcRoute();
}

// 'arrOfCoords' comes from app.js (effectively stores the same info as 'arrOfSelectedStopObjs' (i.e. All the stops between starting and ending points of the route journey))
// Function to draw the directions on the map
function calcRoute() {
  var start = new google.maps.LatLng(arrOfCoords[0].latitude,arrOfCoords[0].longitude);
  var end = new google.maps.LatLng(arrOfCoords[arrOfCoords.length - 1].latitude,arrOfCoords[arrOfCoords.length - 1].longitude);
  // console.log("Calc-Route-Start");
  // console.log(arrOfCoords[0].latitude);
  // console.log(arrOfCoords[0].longitude);
  // console.log("Calc-Route-End");
  // console.log(arrOfCoords[arrOfCoords.length - 1].latitude);
  // console.log(arrOfCoords[arrOfCoords.length - 1].longitude);
  console.log("=================================================================================================");
  var request = {
    origin: start,
    destination: end,
    travelMode: 'TRANSIT',
    transitOptions: {
      modes: ['BUS']
    },
    provideRouteAlternatives: true
  };

  directionsService.route(request, function(result, status) {
    // console.log(typeof result);
    // console.log(result);
    console.log(result.routes); // GETS AN ARRAY OF 4 RESULTS EVERY TIME??? ((4) [{…}, {…}, {…}, {…}])
    // console.log(result.routes[0]);
    var selectedRoute = document.getElementById("json-routes").value;
    var routes = result.routes;
    for(i = 0; i < routes.length; i++) {
      var steps = result.routes[i].legs[0].steps;
      var transitCount = 0;
      var busLine = '';
      for (j = 0; j < steps.length; j++) {
        console.log(steps[j]);
        if (steps[j].travel_mode === "TRANSIT") {
          transitCount++;
          busLine = steps[j].transit.line.short_name;
        }
      }
      if (transitCount == 1 && busLine == selectedRoute) {
        if (status == 'OK') {
          directionsDisplay.setDirections(result);
          directionsDisplay.setRouteIndex(i);
        } else {
          window.alert('Directions request failed due to ' + status);
        }
      } else {
        initMap();
        window.alert('Directions not found.');
      }
      break;
    }
  });
}

// ================================ SEARCH BY BUS STOP ==============================================

// Function to display the full journeys of all routes serviced by the bus stop
$("#show-all-routes-serviced").click(function(e) {
  // Disable submit button from reloading the page when clicked
  e.preventDefault();
  console.log("BUTTON CLICKED! - SHOW ALL ROUTES SERVICED BY THE SELECTED BUS STOP")
});