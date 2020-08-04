// Change map style to night mode
function nightMode() {
  // Onchange event the map will either be set to night or day colors
  // Function is called by a switch button
  var switchValue = document.getElementsByClassName("night-mode-switch")[0]
    .checked
    ? true
    : false;
  if (switchValue) {
    $.ajax({
      url: "./static/google_map_styles/night_mode.json",
      async: false,
      dataType: "json",
      success: function (json_style) {
        map.setOptions({ styles: json_style });
      },
      error: function (error) {
        // An error most likely won't arise unless we mess with the JSON data or path
        console.log(`Error ${error}`);
      },
    });
  } else {
    map.setOptions({ styles: google.maps.MapTypeId.ROADMAP });
  }
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
var FullRouteMarkers = [];
var markerCluster;
var journeyMarker;
var destinationMarker;
// Search by bus stop vars below;
var searched_bus_stop_marker;
var all_polylines = []; // List to store all the generated polylines (for Search by Bus Stop)
// List of colours for polylines
var polyline_colours = [
  "#ff0000",
  "#fdff00",
  "#00fe00",
  "#0000fd",
  "#fd00fd",
  "#FF6347",
  "#40E0D0",
  "#ffc0cb",
  "#808000",
  "#999999",
  "#800000",
  "#f4a460",
  "#a83262",
  "#32a883",
];

// Reads the local JSON file with the attractions info
var xmlhttp = new XMLHttpRequest(); // Initialise request object
var url = "./static/attractions.json";
var attractions = null;
xmlhttp.onreadystatechange = function () {
  if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
    attractions = JSON.parse(xmlhttp.responseText);
  }
};
xmlhttp.open("GET", url, true);
xmlhttp.send();

// **************** Initialising the Map ****************
function initMap() {
  map = new google.maps.Map(document.getElementById("map"));

  // Disabling double-clicking zoom feature when setting a destination marker
  map.setOptions({ disableDoubleClickZoom: true });

  // DESTINATION MARKER
  // Destination Marker icon (currently a bullseye - will be updated at some stage)
  var icon = {
    url: "./static/images/gps_red.svg",
    scaledSize: new google.maps.Size(30, 30),
    anchor: new google.maps.Point(12.5, 12.5),
  };
  // Destination Marker
  destinationMarker = new google.maps.Marker({
    position: null, // Initially set to null (until map double clicked)
    map: map,
    icon: icon,
  });

  // Add marker on DOUBLE click (Will be used later for adding origin and destination points)
  map.addListener("dblclick", function (e) {
    placeDestinationMarker(e.latLng, map, destinationMarker);
  });

  // For autocomplete on Home Search Boxes;
  // (Origin)
  origin_autocomplete = new google.maps.places.Autocomplete(
    document.getElementById("origin-home-search"),
    {
      componentRestrictions: { country: ["IE"] },
      fields: ["place_id", "geometry", "name"],
    }
  );

  // (Destination)
  destination_autocomplete = new google.maps.places.Autocomplete(
    document.getElementById("destination-home-search"),
    {
      componentRestrictions: { country: ["IE"] },
      fields: ["place_id", "geometry", "name"],
    }
  );

  // Single instances to be used for the directions (displaying journey and rendering)
  // 1. Initialise a Directions Service object (computes directions between 2 or more places by sending direction queries to Google's servers).
  directionsService = new google.maps.DirectionsService();
  // 2. Instantiate a Directions Renderer object (Renders directions obtained from the DirectionsService.)
  directionsDisplay = new google.maps.DirectionsRenderer({
    preserveViewport: false,
  });

  navigator.geolocation.getCurrentPosition(
    function (position) {
      // Center map on user's current location if geolocation prompt allowed
      var usersLocation = new google.maps.LatLng(
        position.coords.latitude,
        position.coords.longitude
      );
      map.setCenter(usersLocation);
      map.setZoom(15);

      // Characteristics of the icon for the user's location
      var icon = {
        url: "./static/images/gps.svg",
        scaledSize: new google.maps.Size(30, 30),
        anchor: new google.maps.Point(12.5, 12.5),
      };
      // ------------CAN MARKER BE REMOVED, AS DOES NOT APPEAR TO BE BEING USED?
      var marker = new google.maps.Marker({
        position: usersLocation,
        map: map,
        icon: icon,
      });
    },
    function (positionError) {
      // Default to Dublin if user denied geolocation prompt
      setMapDublin();
    }
  );

  // Characteristics of the icon for Bus Stops
  var busStopIcon = {
    url: "./static/images/bus_stop_icon.svg",
    scaledSize: new google.maps.Size(25, 25),
    anchor: new google.maps.Point(12.5, 12.5),
  };

  // Loading the bus stops and adding them to the map
  // $.getJSON("./static/bus_stops.json", function(stops) {
  $.getJSON("./static/HD_stops_Frontend.json", function (stops) {
    // console.log(stops);
    var stop_properties = Object.values(stops);
    var markers = stop_properties.map(function (property, i) {
      // var markers = stops.map(function(property, i) {
      var stopCoords = new google.maps.LatLng(property.lat, property.long);
      // var stopCoords = new google.maps.LatLng(property.latitude, property.longitude);
      var marker = new google.maps.Marker({
        position: stopCoords,
        icon: busStopIcon,
        title: property.stop_num, // Title is each marker's stop num (which we use to generate timetable data for the info window that is unique to each bus stop)
      });
      stopsInfowindow(marker);
      global_markers.push(marker);
      return marker;
    });
    // console.log(global_markers);

    // Add a marker clusterer to manage the markers.
    markerCluster = new MarkerClusterer(map, markers, {
      ignoreHidden: true,
      imagePath:
        "https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m",
    });
  });
}

// **************** Toggle Hide/Show all map markers (and clusters) ****************

// 1. CLEAR all the markers from the map
function clearMarkers() {
  // If the first marker in the array of markers is visible, then they are all visible
  if (global_markers[0]["visible"]) {
    // Therefore, set each marker in the array's visibility to false
    for (var i = 0; i < global_markers.length; i++) {
      global_markers[i].setVisible(false);
    }
  }
  markerCluster.repaint();
}

// 2. SHOW all the markers from the map
function showMarkers() {
  // If the first marker in the array of markers is visible, then they are all visible
  if (global_markers[0]["invisible"]) {
    // Therefore, set each marker in the array's visibility to false
    for (var i = 0; i < global_markers.length; i++) {
      global_markers[i].setVisible(true);
    }
  }
  markerCluster.repaint();
}

// 3. Toggle Hide/Show all the markers on the map
function toggleMarkerVisibility() {
  // If the first marker in the array of markers is visible, then they are all visible
  if (global_markers[0]["visible"]) {
    // Therefore, set each marker in the array's visibility to false
    for (var i = 0; i < global_markers.length; i++) {
      global_markers[i].setVisible(false);
    }
  } else {
    // else they're all not visible, so make them visible
    for (var i = 0; i < global_markers.length; i++) {
      global_markers[i].setVisible(true);
    }
  }
  markerCluster.repaint(); // Show OR Hide the Marker cluster (depending on whichever condition passed)
}

// Pan to User's Location
// Called with an onclick event
function panToUsersLocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function (position) {
      let user_coords = position.coords;
      var userLatLng = new google.maps.LatLng(
        user_coords.latitude,
        user_coords.longitude
      );
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
var attractionsArray = [];

// The switch button calls this function on change to display the attractions on the map
function displayAttractions() {
  toggleMarkerVisibility();
  setMapDublin(); // Center the map in Dublin
  // Check the value of the switch button
  var switchValue = document.getElementsByClassName("attractions-switch")[0]
    .checked
    ? true
    : false;
  if (switchValue) {
    // Loop through the attractions in the JSON file and add marker for each to the map
    for (i = 0; i < attractions.length; i++) {
      var latitude = parseFloat(attractions[i].latitude);
      var longitude = parseFloat(attractions[i].longitude);
      var iconName = attractions[i].icon;
      var url = "./static/images/attractions/" + iconName + ".svg";
      var icon = {
        url: url,
        scaledSize: new google.maps.Size(50, 50),
        anchor: new google.maps.Point(20, 40),
      };
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(latitude, longitude),
        title: attractions[i].title,
        map: map,
        icon: icon,
      });
      // Add on click info windows to each attraction
      attractionsInfowindow(marker, attractions[i].title);

      attractionsArray.push(marker);
    }
  } else {
    // When switch is off, remove all the attraction makers from the map
    for (i = 0; i < attractionsArray.length; i++) {
      attractionsArray[i].setMap(null);
    }
  }
}

// Display info window for each attraction
function attractionsInfowindow(marker, title) {
  var infowindow = new google.maps.InfoWindow({
    maxWidth: 250,
  });
  marker.addListener("click", function () {
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
    var contentString =
      '<div class="attractions-infowindow">' +
      '<div class="attractions-content">' +
      '<h4 class="attractions-title">' +
      title +
      "</h4>" +
      '<a href="#" onclick="calcRouteToAttraction(' +
      latitude +
      ", " +
      longitude +
      ')">Directions</a>' +
      '<div class="attractions-image"><img src="' +
      image +
      '" alt="' +
      title +
      '" style="max-width:250px; max-height:250px;"></div>' +
      '<div id="attractions-bodyContent">' +
      '<p class="attractions-summary">' +
      summary +
      '&nbsp;<a href="' +
      url +
      '">More Info</a></p>' +
      "</div>" +
      "</div>";
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
  geocoder.geocode({ location: latlng }, function (results, status) {
    if (status === "OK") {
      if (results[0]) {
        // Set the value of geocodeLatLng to the inner HTML of destination
        document.getElementById("destination-home-search").value =
          results[0].formatted_address;
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
  map.setCenter(new google.maps.LatLng(53.346, -6.28));
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
  geocodeLatLng(
    latLng.lat(),
    latLng.lng(),
    geocoder,
    map,
    infowindow,
    destMarker
  );
}

// Converts the coordinate information of a double-clicked location on the map to its placename
function geocodeLatLng(latitude, longitude, geocoder, map, infowindow, marker) {
  var latlng = { lat: latitude, lng: longitude };
  geocoder.geocode({ location: latlng }, function (results, status) {
    if (status === "OK") {
      if (results[0]) {
        infowindow.setContent(results[0].formatted_address);
        // infowindow.open(map, marker); // Open the Destination marker info window
        // Set the value of geocodeLatLng to the inner HTML of destination
        document.getElementById("destination-home-search").value =
          results[0].formatted_address;
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
    url: "make_rpti_realtime_api_request", // Name of the function in views.py in the backend that requests the API
    async: false, // AJAX call needs to be asynchronous to make the result variable (on success) available to the 'stopsInfowindow' function
    type: "GET", // We are making a GET request, as there is no security issues with the data we're retrieving
    data: {
      inputStopNum: stopNum, // This is the data that is passed into by the backend via a GET request, which the backend can then use to make the relevant RPTI API call
    },
    success: function (result) {
      // If the Request is successful (i.e. There was a request made in the backend that returned "something", BUT N.B. the response may return an EMPTY array, as no results were found)
      // 'result' is a JsonResponse object returned from the 'make_rpti_realtime_api_request' func in views.py (effectively a json-string).
      console.log(result);
      // We must now parse the string into a JSON object here.
      parsed_realtime_info = JSON.parse(result);
      console.log(parsed_realtime_info);
      // This 'parsed_realtime_info' variable is now available anywhere in the code (because the ajax function was NOT aynschronous)
    },
    error: function (error) {
      // An most likely won't arise unless the API goes down (Or perhaps is requested too many times?)
      console.log(`Error ${error}`);
    },
  });
}

// **************** Creates the content of the info window of the marker that is clicked to relevant real-time info generated on backend ****************
function setWindowContentHTML(objects, stopNum) {
  // Function takes 2 parameters:
  // 1. The array of objects (info about buses coming to the clicked bus stop)
  // 2. The number of the stop marker that is clicked.

  // let outputHTML = "";
  let outputHTML = `<div id="bus-stop-info-container">
                      <h5 style="text-align: center; text-decoration: underline;">${stopNum}</h5>
                      <div class="btn-group btn-group-sm container" role="group" id="bus-stop-tabs">
                        <button type="button" class="btn btn-secondary">Due</button>
                        <button type="button" class="btn btn-secondary">Timetable</button>
                      </div>
                      <table id="due-table">
                        <th>Route</th>
                        <th>Origin</th>
                        <th>Destination</th>
                        <th>Due</th>
                    `;

  // If the API call was successful, and we got an array of objects, then fill the info window content with the data
  if (objects.length > 0) {
    for (i = 0; i < objects.length; i++) {
      console.log(objects[i]);
      // Original Version
      // outputHTML += `
      //   <div id="marker-window-realtime-content">
      //     <h6>${objects[i]["route"]}</h6>
      //     <p><b>${objects[i]["origin"]}</b> to <b>${objects[i]["destination"]}</b></p>
      //     <p>Due: ${objects[i]["due"]}</p>
      //     <p>Scheduled Arrival: ${objects[i]["scheduled_arrival_datetime"]}</p>
      //     <p>Actual Arrival: ${objects[i]["arrival_datetime"]}</p>
      //     <hr>
      //   </div>
      // `;
      // Tabular Version
      outputHTML += `
        <tr>
          <td>${objects[i]["route"]}</td>
          <td>${objects[i]["origin"]}</td>
          <td>${objects[i]["destination"]}</td>
          <td>${objects[i]["due"]}</td>
        </tr>
      `;
    }
    outputHTML += `
                      </table>
                    </div>
                  `;
    // else, the API call didn't get any data, so we fill the info window with this info to inform the user of the same.
  } else {
    outputHTML = "No Information available for Stop: " + stopNum;
  }

  return outputHTML;
}

// **************** Sets the content of the info window of the marker that is clicked to relevant real-time info generated on backend ****************
function stopsInfowindow(marker) {
  var infowindow = new google.maps.InfoWindow();
  marker.addListener("click", function () {
    grabRealTimeContent(marker.title); // Makes a call to the RPTI API via the backend based on the stop number (marker.title)
    closeLastOpenedInfoWindow(lastOpenedInfoWindow);
    // console.log(parsed_realtime_info); // Shows the array of objects that is gotten from 'https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?type=day&stopid=' + BusStopNumber

    let realtime_content = setWindowContentHTML(
      parsed_realtime_info,
      marker.title
    );
    // Set Window to real-time info relevant to the clicked bus stop

    infowindow.setContent(realtime_content);

    infowindow.open(map, marker);
    lastOpenedInfoWindow = infowindow;
  });
}

// ================================ HOME ==============================================
// Display the user's location when switch button is on, clear the origin field when off
// Called when switch button changes
function fillUsersLocation() {
  // Check the value of the switch button
  var switchValue = document.getElementsByClassName("users-location-switch")[0]
    .checked
    ? true
    : false;
  // If switch button on
  if (switchValue) {
    // Get User's current location and fill origin with it.
    getUsersLocation();
  } else {
    // Clear the origin field
    document.getElementById("origin-home-search").value = null;
  }
}

// Function to get User's Location
function getUsersLocation() {
  // If the user has enabled geolocation, then call a function that populates the "Origin" input with the user's location
  if (navigator.geolocation) {
    console.log(
      navigator.geolocation.getCurrentPosition(logSuccessAndPopulateOrigin)
    );
  } else {
    alert("Geolocation is not supported or enabled.");
  }
}

function logSuccessAndPopulateOrigin(pos) {
  // Populates the "Origin" input on Home screen with the user's position (text, NOT actual coordinates, so possibly not too accurate)
  var coordinates = pos.coords;

  console.log("Your current position is:");
  console.log(`Latitude : ${coordinates.latitude}`);
  console.log(`Longitude: ${coordinates.longitude}`);
  console.log(`More or less ${coordinates.accuracy} meters.`);

  // Reverse Geocode the Coordinates into the Place name, so that it can then be pasted into the "Origin" input text box
  var geocoder = new google.maps.Geocoder();

  var latlng = { lat: coordinates.latitude, lng: coordinates.longitude };
  geocoder.geocode({ location: latlng }, function (results, status) {
    if (status === "OK") {
      if (results[0]) {
        // Set the value of the user's coordinates to the inner HTML of "Origin" text input
        document.getElementById("origin-home-search").value =
          results[0].formatted_address;
      } else {
        alert("No location results found for the User's current location");
      }
    }
  });
}

// Render directions based on origin and destination (COORDINATES, NOT PLACE NAMES) on home tab;
// I'm going to try change to let instead of const
const calculateAndRenderDirections = (
  origin,
  destination,
  directionsService,
  directionsDisplay
) => {
  let request = {
    origin: origin,
    destination: destination,
    travelMode: "TRANSIT", // Show how to get from A to B by bus (where posssible???)
  };
  // displays journery on map
  directionsDisplay.setMap(map);
  // .route takes 2 parameters:
  // 1. a Directions Request
  // 2. a Callback function (which takes in the Result of the Directions Query and a status (to show if query to Google servers was successful))
  directionsService.route(request, (result, status) => {
    if (status == "OK") {
      console.log("here okay??");
      // server request is OK, set the renderer to use the result to display the directions on the renderer's designated map and panel.
      directionsDisplay.setMap(map);

      // *******This is what we want to replace*******
      directionsDisplay.setDirections(result);
    } else {
      alert("There was a problem with calculating your route");
    }
    console.log("in the calc_function");

    // ************* Message Printout for users in Div (Directions, Instructions etc) *************
    // journey is contained within first leg [0]
    let legs = result.routes[0].legs[0];
    let departure_time = legs.departure_time.text;
    let arrival_time = legs.arrival_time.text;
    let duration = legs.duration.text;
    let distance = legs.distance.text;

    // let start_address = legs.start_address;
    // // get just the name
    // start_address = start_address.replace(", Dublin, Ireland", "");
    // let end_address = legs.end_address;
    // end_address = end_address.replace(", Dublin, Ireland", "");

    let steps = legs.steps;
    // get number of steps
    // let step_number = Object.size(steps);
    // Check current details
    // console.log(step_number);

    // console.log(legs);
    // console.log("Total Journey Details");
    // console.log("=====================");
    // console.log("Departure Time:", departure_time);
    // console.log("Arrival Time:", arrival_time);
    // console.log("Total Duration:", duration);
    // console.log("Total Distance:", distance);
    // console.log(steps);

    journey_details_div = document.getElementById("journey-details");
    console.log("journey details:", journey_details_div);

    // NIALL EXTRA-----------------------------
    // This part is for deteriming which steps in the journey are walking
    // Array for storing indexes for walking
    // let walk_arr = [];
    // steps.forEach(function (step, index) {
    //   console.log("index: ", index);

    // -------------IF STEP == WALKING--------
    // if (step.travel_mode == "WALKING") {
    //   // if so push to array (why index +1?)
    //   walk_arr.push(index + 1);

    //   // For the first step
    //   if (index == 0) {
    //     console.log("In walking 0");
    // Add distance and duration to the appropriate div (left hand side)
    // Add start address and walking button to the appropriate div (right hand side)

    // e.g.
    // left_side[
    //   index
    // ] += `<div class="journey_details">${step.distance.text}</div>
    // <div class="journey_details">${step.duration.text}</div>`;

    // right_side[
    //   index
    // ] += `${start_address} <br> <div class="instruction"> <i class="material-icons">directions_walk</i></div>`;
    // }
    // for the last step
    // else if (index == step_number - 1) {
    //   console.log("In walking last");
    // Add info to left side
    // e.g.
    // left_side[
    //   index
    // ] += `<div class="journey_details">${step.distance.text}</div>
    // <div class="journey_details">${step.duration.text}</div>`;

    // // Need to get the arrival stop from the bus/transit (i.e. from previous step - to display as the address)
    // let prev_transit_stop = steps[index - 1].transit.arrival_stop.name;
    // Add info to right side - the end address is the final info that needs to be added
    // right_side[
    //   index
    // ] += ` ${prev_transit_stop} <br> <div class="instruction"> <i class="material-icons">directions_walk</i> </div>`;
    // }
    // Finally if walking is between two transit forms along the journey
    // else {
    //   //  Just add the appropriate info, Use the arrival stop from the previous transit step as the starting address
    // left_side[
    //   index
    // ] += `<div class="journey_details">${step.distance.text}</div>
    // <div class="journey_details">${step.duration.text}</div>`;
    // let prev_transit_stop = steps[index - 1].transit.arrival_stop.name;
    // right_side[
    //   index
    // ] += `${prev_transit_stop} <br> <div class="instruction"> <i class="material-icons">directions_walk</i> </div>`;
    //   }
    // }
    // // CHECK FOR BUS - walking step has no key called 'transit'
    // else if ("transit" in step) {
    //   console.log("In transit ");
    // Add info to left side
    // left_side[
    //   index
    // ] += `<div class="journey_details">${step.distance.text}</div>
    // <div class="journey_details">${step.duration.text}</div>`;

    // let start_stop = step.transit.departure_stop.name;
    // let route = step.transit.line.short_name;
    // let transit_type = step.transit.line.vehicle.name;

    // // SELECT APPROPRIATE ICON FOR THE JOURNEY
    // if (transit_type.includes("Bus")) {
    //   var icon = "directions_bus";
    // } else if (transit_type.includes("Train")) {
    //   var icon = "train";
    // }
    // // Backup
    // else {
    //   var icon = "arrow_downward";
    // }
    // // ADD INFORMATION TO THE RHS DIV
    // console.log("TYPE   ", transit_type);
    // Add info to right side
    // right_side[
    //   index
    // ] += `${start_stop} <br> <i class="material-icons">${icon}</i> ${route} `;

    // console.log("right index transit: ", right_side[index]);
    // console.log("left index transit: ", left_side[index]);

    // console.log("Start_stop : ", start_stop);
    // console.log("end_stop : ", end_stop);
    // console.log("route : ", route);
    //   }
    // });
    // GET ELEMENTS TO ADD INFORMATION TO
    // right_step = document.getElementById("start_stop");
    // left_step = document.getElementById("time_dist");

    // //  PUTTING TOGETHER ALL THE INFORMATIOIN INTO ONE STRING THAT CAN BE PUSHED TO AN ELEMENT

    // //  FOR EACH STEP - ADD IN THE APPROPRIATE INDEX FOR EACH SIDE (LHS AND RHS)
    // steps.forEach(function (step, index) {
    //   console.log("index check: ", index);
    //   right_step.innerHTML += right_side[index] + "</div>";
    //   left_step.innerHTML += left_side[index];
    // });
    // // Add last stop to RHS and closing div
    // right_step.innerHTML += `<div id="last" class="step_right"> ${end_address} </div> </div>`;
    // left_step.innerHTML += "</div>";

    // // TIMELINE DESIGN - div borders (i.e. timeline design) if walking = dashed or not (solid)
    // console.log(walk_arr);
    // let count = 1;
    // while (count < step_number + 1) {
    //   console.log(walk_arr, count);
    //   //  if walk array includes that number - means there is walking @ that step, need to change border to dashed
    //   if (walk_arr.includes(count)) {
    //     console.log("YUP! ", count);
    //     document.getElementById(`right_step${count}`).style.borderLeftStyle =
    //       "dashed";
    //   }
    //   count += 1;
    // }

    // \NIALL EXTRA--------------------------

    // Add Button to "Exit" the journey
    journey_details_div.innerHTML = `
    <div>
      <button class="btn btn-info" onclick="exitJourney(journey_details_div)">Exit Journey</button>
    </div>
    `;

    let today = new Date();
    let suffix = "am";
    let hours = today.getHours();
    // Logic to make Current time fit with 12-hour clock format of the Google Map's Service object (instead of 24 hour format)
    if (hours >= 12) {
      suffix = "pm";
      hours -= 12;
    }
    // Creating 12-hour format for current time
    let current_time = hours + "." + today.getMinutes() + suffix;

    // Total Journey info (at the top of the div)
    journey_details_div.innerHTML += `
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

    // Subsequent info consists of the "Steps" that make up the total journey (e.g. Step 1, walk to X, Step 2. From X, get a bus to Y etc)
    steps.forEach(function (step, index) {
      journey_details_div.innerHTML += `
        <div>
          <b>Step: ${index + 1} (${step.travel_mode} for ~${
        step.duration.text
      })</b>
          <p>${step.instructions}</p>
          <p>Distance: ${step.distance.text}</p>
        </div>
      `;
    });

    // Add container at the end with a directions panel
    journey_details_div.innerHTML += `<div id="directions-panel"></div>`;

    // Displays google panel ***DESTROY THIS PLS******
    directionsDisplay.setPanel(document.getElementById("directions-panel"));

    // Add a class to the div containing the journey details to make it visible
    document.getElementById("journey-details").className = "journey-details";
  });
};

// ************************ "Exit" the journey generated in "Home" ************************
function exitJourney(div_to_set_empty) {
  // ========= Remove Visual Render =========
  // Remove the rendered Journey
  directionsDisplay.setMap(null);
  // Remove the Destination Marker
  destinationMarker.setPosition(null); // Not working (No scope on destination marker)

  // ========= Set Journey Info to "" =========
  div_to_set_empty.innerHTML = null;
}

$("#home-submit").click(function (e) {
  // Disable submit button from reloading the page when clicked
  e.preventDefault();

  // Grab the values of the "Origin" and "Destination" input boxes
  // Maybe it's better to use Lat and Long coordinates to improve accuracy?
  var start = document.getElementById("origin-home-search").value;
  var end = document.getElementById("destination-home-search").value;
  // If the user filled in both the Origin and Destination inputs correctly
  if (start.length > 0 && end.length > 0) {
    calculateAndRenderDirections(
      start,
      end,
      directionsService,
      directionsDisplay
    );
  } else {
    // else, alert user with an appropriate error message
    // LOGIC HERE IS VERY BAD... CODE IS NOT DRY! NEED TO FIGURE OUT BETTER ALTERNATIVE
    let alert_message = "ERROR: Missing Details: ";

    let duration_of_error_class = 1500;

    if (start.length > 0) {
      alert_message += "Destination";
      alert(alert_message);
      // Add and remove error class to highlight problematic input for user
      $("#destination-home-search").addClass("error");
      setTimeout(function () {
        $("#destination-home-search").removeClass("error");
      }, duration_of_error_class);
    } else if (end.length > 0) {
      alert_message += "Origin";
      alert(alert_message);
      // Add and remove error class to highlight problematic input for user
      $("#origin-home-search").addClass("error");
      setTimeout(function () {
        $("#origin-home-search").removeClass("error");
      }, duration_of_error_class);
    } else {
      alert_message += "Origin and Destination";
      alert(alert_message);
      // Add and remove error class to highlight problematic input for user
      $("#origin-home-search").addClass("error");
      setTimeout(function () {
        $("#origin-home-search").removeClass("error");
      }, duration_of_error_class);
      $("#destination-home-search").addClass("error");
      setTimeout(function () {
        $("#destination-home-search").removeClass("error");
      }, duration_of_error_class);
    }
  }
});
// ================================ SEARCH BY ROUTE ==============================================

// Function to map the entire route
function showJourney(stopArray) {
  // Need to make sure all other route stops are gone FINITO -  do try block to attempt to remove all other markers (i.e. previous routes)
  try {
    // remove markers if they exist from the map
    for (x = 0; x < FullRouteMarkers.length; x++) {
      FullRouteMarkers[x].setMap(null);
    }
    // empty out the array
    FullRouteMarkers.length = 0;
  } catch (err) {
    console.log("YOU GOT AN ERROR - LIME 766");
    console.log(err);
  }
  // Save a variable that will be accessible within map.js
  clearMarkers();
  // get coordinates of journey
  var bounds = new google.maps.LatLngBounds();
  for (i = 0; i < stopArray.length; i++) {
    let lat = stopArray[i]["lat"];
    let long = stopArray[i]["long"];
    let busLatLng = { lat: lat, lng: long };
    var markers = []; //some array
    // set the bounds to cover the route (i.e. fit in the route) - this should make viewport change to route
    var temp = new google.maps.LatLng(lat, long);
    // add latlong to bounds
    bounds.extend(temp);
    // Set first and last stops to have different colours
    if (i == 0) {
      // Start stop
      var busStopIcon = {
        url: "./static/images/m3.png",
        scaledSize: new google.maps.Size(25, 25),
        anchor: new google.maps.Point(12.5, 12.5),
      };
    } else if (i == stopArray.length - 1) {
      // End stop
      var busStopIcon = {
        url: "./static/images/m4.png",
        scaledSize: new google.maps.Size(25, 25),
        anchor: new google.maps.Point(12.5, 12.5),
      };
    } else {
      // any other stop
      var busStopIcon = {
        url: "./static/images/bus_stop_icon.svg",
        scaledSize: new google.maps.Size(25, 25),
        anchor: new google.maps.Point(12.5, 12.5),
      };
    }
    // Create a marker of that lat and long - does this put it onto the map?
    var RouteMark = new google.maps.Marker({
      position: busLatLng,
      map: map,
      icon: busStopIcon,
    });
    // console.log("what does a marker look like:", RouteMark);
    // Push each marker of the journey to the array
    FullRouteMarkers.push(RouteMark);
  }
  map.fitBounds(bounds);
}

function filterRoute() {
  var start = parseInt(document.getElementById("json-starting-stops").value);
  var end = parseInt(document.getElementById("json-ending-stops").value);
  // Mske new bounds variable
  var bounds = new google.maps.LatLngBounds();
  // Function filters the stops shown on a complete route based on dropdown selection

  for (x = 0; x < FullRouteMarkers.length; x++) {
    // if they are outside the desired range then set them to null, do the same with the bounds - need a way to modify bounds
    if (x < start || x > end) {
      FullRouteMarkers[x].setMap(null);
    } else {
      // get lat long position for the new markers
      var temp = FullRouteMarkers[x].getPosition();
      bounds.extend(temp);
      // changing markers
      // set new end and start stop markers
      // Set first and last stops to have different colours
      if (x == start) {
        // Start stop
        var busStopIcon = {
          url: "./static/images/m3.png",
          scaledSize: new google.maps.Size(25, 25),
          anchor: new google.maps.Point(12.5, 12.5),
        };
        FullRouteMarkers[x].setIcon(busStopIcon);
      } else if (x == end) {
        console.log("end");
        // End stop
        var busStopIcon = {
          url: "./static/images/m4.png",
          scaledSize: new google.maps.Size(25, 25),
          anchor: new google.maps.Point(12.5, 12.5),
        };
        FullRouteMarkers[x].setIcon(busStopIcon);
      } else {
        // standard stop icon
        var busStopIcon = {
          url: "./static/images/bus_stop_icon.svg",
          scaledSize: new google.maps.Size(25, 25),
          anchor: new google.maps.Point(12.5, 12.5),
        };
        FullRouteMarkers[x].setIcon(busStopIcon);
      }

      FullRouteMarkers[x].setMap(map);
    }
  }
  // shift map focus
  map.fitBounds(bounds);
}
// ************************ CODE TO SET MAP TO WHATEVER JOURNEY IS SEARCHED in "Search By Route" (outside of init function) ************************
function showJourneyOnMap(arrOfSelectedStopObjs, arrOfCoords) {
  // Function takes an array of selected Stop Objects (referring to all the stops from start stop A to ending stop B inclusive decided by the user)
  // This function is called by 'app.js', as app.js is where the array of selected routes is generated.
  var markersArray = []; // variable that will hold all the markers of the journey (should (hopefully) be cleared each time so old journeys are removed from map)
  for (var i = 0; i < markersArray.length; i++) {
    markersArray[i].setMap(null);
  }
  // Clear out the existing stops
  console.log("just above clearMarkers");
  clearMarkers();

  for (var i = 0; i < arrOfSelectedStopObjs.length; i++) {
    let bus_stop_lat = arrOfSelectedStopObjs[i]["lat"]; // Bus Stop Latitude
    let bus_stop_long = arrOfSelectedStopObjs[i]["long"]; // Bus Stop Longitude
    let busLatLng = { lat: bus_stop_lat, lng: bus_stop_long }; // Bus Stop LatLng object

    var busStopIcon = {
      // WAS THINKING MAYBE WE SHOULD HAVE A DIFFERENT ICON HERE TO HIGHLIGHT THE STOPS OF THE JOURNEY
      url: "./static/images/bus_stop_icon.svg",
      scaledSize: new google.maps.Size(25, 25),
      anchor: new google.maps.Point(12.5, 12.5),
    };
    // Create a marker of that lat and long
    journeyMarker = new google.maps.Marker({
      position: busLatLng,
      map: map,
      icon: busStopIcon,
    });
    // Push each marker of the journey to the array
    markersArray.push(journeyMarker);
  }
  // Calls the function to display the directions on the map
  directionsDisplay.setMap(map);
  directionsDisplay.setPanel(
    document.getElementById("routes-directions-panel")
  );

  // Add a class to the div containing the journey details to make it visible
  document.getElementById("routes-directions-panel").className =
    "journey-details";
  calcRoute(arrOfCoords);
}

// 'arrOfCoords' comes from app.js (effectively stores the same info as 'arrOfSelectedStopObjs' (i.e. All the stops between starting and ending points of the route journey))
// Function to draw the directions on the map
function calcRoute(arrOfCoords) {
  var start = new google.maps.LatLng(
    arrOfCoords[0].latitude,
    arrOfCoords[0].longitude
  );
  var end = new google.maps.LatLng(
    arrOfCoords[arrOfCoords.length - 1].latitude,
    arrOfCoords[arrOfCoords.length - 1].longitude
  );
  // console.log("Calc-Route-Start");
  // console.log(arrOfCoords[0].latitude);
  // console.log(arrOfCoords[0].longitude);
  // console.log("Calc-Route-End");
  // console.log(arrOfCoords[arrOfCoords.length - 1].latitude);
  // console.log(arrOfCoords[arrOfCoords.length - 1].longitude);
  console.log(
    "================================================================================================="
  );
  var request = {
    origin: start,
    destination: end,
    travelMode: "TRANSIT",
    transitOptions: {
      modes: ["BUS"],
    },
    provideRouteAlternatives: true,
  };

  directionsService.route(request, function (result, status) {
    // console.log(typeof result);
    // console.log(result);
    // console.log(result.routes); // GETS AN ARRAY OF 4 RESULTS EVERY TIME??? ((4) [{…}, {…}, {…}, {…}])
    // console.log(result.routes[0]);
    var selectedRoute = document.getElementById("json-routes").value;
    var routes = result.routes;
    console.log("routes: ", routes);
    for (i = 0; i < routes.length; i++) {
      var steps = result.routes[i].legs[0].steps;
      var transitCount = 0;
      var busLine = "";
      // Loops through steps and counts the number of transit steps (should be at least 1 or its walking)
      for (j = 0; j < steps.length; j++) {
        console.log("steps", steps[j]);
        console.log("keys:", Object.keys(steps[j]));
        console.log("checking:", steps[j].travel_mode);
        if (steps[j].travel_mode === "TRANSIT") {
          console.log("in travel mode check");
          transitCount++;
          busLine = steps[j].transit.line.short_name;
        }
      }
      // Should be only 1 transit for a bus - otherwise googlemaps is suggesting two buses
      if (transitCount == 1 && busLine == selectedRoute) {
        if (status == "OK") {
          directionsDisplay.setDirections(result);
          directionsDisplay.setRouteIndex(i);
        } else {
          window.alert("Directions request failed due to " + status);
        }
      } else {
        // This means that translit count != 1 or busline != selected route (obtained from dropdown)
        // So what happens if there are two buses??
        initMap();

        console.log("CALC ROUTE ELSE");
        console.log("transitCount:", transitCount);
        console.log("busline:", busLine);
        console.log("route:", selectedRoute);

        window.alert("Directions not found.");
      }
      break;
    }
  });
}

// ================================ SEARCH BY BUS STOP ==============================================

// Function to display the full journeys of all routes serviced by the bus stop (via use of markers)
$("#show-all-routes-serviced").click(function (e) {
  // Disable submit button from reloading the page when clicked
  e.preventDefault();
  console.log(
    "BUTTON CLICKED! - SHOW ALL ROUTES SERVICED BY THE SELECTED BUS STOP"
  );
  // console.log(all_stops);

  let selected_bus_stop = document.getElementById("busstop-search").value;
  console.log(selected_bus_stop); // e.g. 905, Yellow Walls Rd, Inbher Ide

  // ====Iterate over all the bus stop objects, grab the bus stop whose search_name matches the value of the "Bus Stop" input, and grab the routes_serviced array====
  for (stop_num in all_stops) {
    let stop_name = all_stops[stop_num].search_name;
    if (stop_name === selected_bus_stop) {
      var routes_serviced = all_stops[stop_num].routes_serviced;

      var stop_props = all_stops[stop_num];
      console.log(stop_props);
      var stop_lat = all_stops[stop_num]["lat"];
      console.log(stop_lat);
      var stop_long = all_stops[stop_num]["long"];
      console.log(stop_long);

      var bus_stop_location = new google.maps.LatLng(stop_lat, stop_long);

      console.log(routes_serviced); // e.g. (5) ["102", "142", "32X", "42", "42D"]
      // break out of the loop once match found
      break;
    }
  }

  // ====Iterate over all the routes_serviced and grab the routes whose name matches an element in all the routes, and grab the route obj====

  // Reset all the polylines every iteration
  for (let i = 0; i < all_polylines.length; i++) {
    console.log(all_polylines[i]);
    all_polylines[i].setMap(null);
  }
  all_polylines.length = 0;

  // console.log(all_polylines);
  // console.log(all_polylines.length);

  // iterate over the routes serviced
  for (var i = 0; i < routes_serviced.length; i++) {
    // console.log(routes_serviced[i]);
    var serviced_route = routes_serviced[i];
    console.log("=========================");
    // iterate over ALL the routes
    for (route_num in all_routes) {
      // console.log(route_num);
      if (route_num === serviced_route) {
        console.log("GOT EEM!");
        // console.log(all_routes[route_num]);
        // Focus on just 1 Direction of a given route (D1)
        let direction_1 = all_routes[route_num].D1;
        // console.log(direction_1);
        // Iterate over all that directions stops to access each stop in order to render them
        console.log("Route:", route_num);
        console.log("----START of Stops Loop----");
        var path_coords = [];
        for (index in direction_1["stops"]) {
          // console.log(index);
          let bus_stop = direction_1["stops"][index];
          // console.log(bus_stop);
          // Grab the bus stop properties of interest
          let stop_num = bus_stop["stop_num"];
          let latitude = bus_stop["lat"];
          let longitude = bus_stop["long"];

          // Create Markers with these details and mark them on the map;

          var seach_by_busstop_icon = {
            // url: './static/images/search_by_stop_icon.png',
            url: "./static/images/bus_stop_icon.svg",
            scaledSize: new google.maps.Size(25, 25),
            anchor: new google.maps.Point(12.5, 12.5),
          };
          var stopCoords = new google.maps.LatLng(latitude, longitude);

          // Create Marker for each of the component bus stops of the serviced route;
          // var search_by_busstop_marker = new google.maps.Marker({
          //   position: stopCoords,
          //   icon: seach_by_busstop_icon,
          //   map: map,
          //   title: stop_num
          // });
          // console.log(stopCoords);
          path_coords.push(stopCoords);

          // Fit the bounds of the generated points
        }
        // Creates the polyline object
        var polyline = new google.maps.Polyline({
          map: map,
          path: path_coords,
          strokeColor: polyline_colours[i],
          strokeOpacity: 0.5,
          strokeWeight: 7,
          geodesic: true,
        });

        polyline.setMap(map);

        // Set a marker for the bus stop that was searched
        searched_bus_stop_marker = new google.maps.Marker({
          position: bus_stop_location,
          map: map,
          title: stop_num,
          animation: google.maps.Animation.DROP,
        });

        map.setCenter(bus_stop_location);
        map.setZoom(13);
        console.log("----END of Stops Loop----");

        // Add each polyline to the list of polylines
        all_polylines.push(polyline);
      }

      // console.log(all_routes[route_num]);
    }
  }

  // ========== Polyline events ==========

  // Initialise an info window for the given polyline
  var infoWindow = new google.maps.InfoWindow();

  // =============== Seems to work BUT route num is wrong ===============
  // ============================ VERSION 3 ============================
  // On mouseover:
  console.log(all_polylines.length);

  // Iterate over all polyline instances
  let location_name = "Location Name";
  for (let i = 0; i < all_polylines.length; i++) {
    let route = routes_serviced[i];
    // let location_name = "Test";
    google.maps.event.addListener(all_polylines[i], "mouseover", function (e) {
      // Open the InfoWindow
      infoWindow.setPosition(e.latLng);

      // Get a given location's name based on its coordinates
      let geocoder = new google.maps.Geocoder();
      let latlng = { lat: e.latLng.lat(), lng: e.latLng.lng() };
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === "OK") {
          if (results[0]) {
            location_name = results[0].formatted_address;
          } else {
            location_name = "No results found";
          }
        } else {
          location_name = "No results found";
        }
        console.log(location_name);
      });

      let windowContent = `
        <div style="text-align: center;" class="container">
          <h5>${route}</h5>
          <p>${location_name}</p>
        </div>
      `;

      infoWindow.setContent(windowContent);
      infoWindow.open(map);
      // Change weight to 10 (makes it bold)
      all_polylines[i].setOptions({ strokeWeight: 12 });
      all_polylines[i].setOptions({ strokeOpacity: 1.0 });
    });

    // On mouseout (stop hovering):
    google.maps.event.addListener(all_polylines[i], "mouseout", function () {
      // Close the InfoWindow
      infoWindow.close();
      // Give original weight
      all_polylines[i].setOptions({ strokeWeight: 7 });
    });
  }
  console.log(routes_serviced.length);

  // ========== Generate Div/Panel to show Routes serviced ==========
  let routes_serviced_display_panel = document.getElementById(
    "routes-serviced-legend"
  );

  // Initially make it empty
  routes_serviced_display_panel.innerHTML = "";

  routes_serviced_display_panel.innerHTML += `<div style="padding:1rem;">
                                                <button onclick="clearPolylines()" class='btn btn-secondary btn-sm'>Clear</button>
                                              </div>`;

  // Then add content
  for (let i = 0; i < routes_serviced.length; i++) {
    routes_serviced_display_panel.innerHTML += `<div>
          <h5 style="display: inline;">${routes_serviced[i]}</h5> <hr style="float:right; height:0.3rem;" width=60% color='${polyline_colours[i]}' size='6'> <br> <hr>
        </div>
        `;
  }

  // Hide the markers on click
  clearMarkers();
});

function clearPolylines() {
  // Clear the panel
  document.getElementById("routes-serviced-legend").innerHTML = "";
  for (let i = 0; i < all_polylines.length; i++) {
    // Clear each polyline
    all_polylines[i].setMap(null);
  }
  // Clear the marker
  searched_bus_stop_marker.setMap(null);
  searched_bus_stop_marker = null;
}
