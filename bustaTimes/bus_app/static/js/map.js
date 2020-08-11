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
var bus_stop_location;
var searched_bus_stop_marker;
var all_searched_bus_stop_markers = [];
var all_polylines = []; // List to store all the generated polylines (for Search by Bus Stop)
var route_polyline; // store current polyline object
var route_coordinates = []; // list to store current coordinates - for route poyline adjustment

// List of colours for polylines
var polyline_colours = [
  "#b6d7e4",
  "#f4d046",
  "#eb5e28",
  "#4c6974",
  "#81a094",
  "#afb5bc",
  "#eb5a5a",
  "#b79492",
  "#e1bbc9",
  "#723d46",
  "#E365C1",
  "#d0e37f",
  "#0CCE6B",
  "#187795"
];
// Variable to keep track of the visibility of the search menu
// Used in the hideMenu function
var menu_visibility = true;

// =============================================================================
// Function that sets all polylines, FullRouteMarkers etc to null, if they exist
// =============================================================================

// Conceptually; as we change a to a different menu tab option, clear all unncessary objects
function clearLingeringRenderedObjects() {
  // ========== LISTS OF LINGERING OBJECTS (e.g. Lists of polylines, lists of markers etc) ==========

  route_polyline.setMap(null);

  // Store all the possible lingering object lists in a list
  var list_of_possible_lingerers_list = [
    FullRouteMarkers,
    all_polylines,
    all_searched_bus_stop_markers,
  ];

  // Iterate over them
  for (let i = 0; i < list_of_possible_lingerers_list.length; i++) {
    // check if they contain anything
    if (list_of_possible_lingerers_list[i].length > 0) {
      let lingering_list = list_of_possible_lingerers_list[i];
      // if they do, iterate over each element and set it to null
      for (let j = 0; j < lingering_list.length; j++) {
        lingering_list[j].setMap(null);
      }
    }
  }

  // ========== SINGLE LINGERING OBJECTS (e.g. Destination marker, Search by Bus Stop marker etc) ==========

  // Store all the possible lingering marker objects in a list
  var list_of_possible_lingerers = [
    searched_bus_stop_marker,
    destinationMarker,
  ];
  // console.log(searched_bus_stop_marker.getTitle());
  // console.log(searched_bus_stop_marker.getPosition().lat());
  // console.log(searched_bus_stop_marker.getPosition().lng());
  // Iterate over them and set them to null
  for (let i = 0; i < list_of_possible_lingerers.length; i++) {
    if (
      list_of_possible_lingerers[i] !== null &&
      list_of_possible_lingerers[i] !== undefined
    ) {
      list_of_possible_lingerers[i].setPosition(null);
    }
  }
}

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

  // Set a marker for the bus stop that was searched
  // searched_bus_stop_marker = new google.maps.Marker({
  //   position: null,
  //   map: map,
  // });

  // Add marker on DOUBLE click (Will be used later for adding origin and destination points)
  map.addListener("dblclick", function (e) {
    placeDestinationMarker(e.latLng, map, destinationMarker);
  });

  // Is there any way we can restrict to Dublin or Leinster, rather than just Ireland???

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

  // This should improve geolocation accuracy
  // var options = {
  //   enableHighAccuracy: true,
  //   timeout: 5000,
  //   maximumAge: 0
  // };

  navigator.geolocation.getCurrentPosition(
    function (position) {
      // Center map on user's current location if geolocation prompt allowed
      var usersLocation = new google.maps.LatLng(
        position.coords.latitude,
        position.coords.longitude
      );
      map.setCenter(usersLocation);
      map.setZoom(15);
      // Trying to get the coords to be more accurate but can't...
      // console.log(position.coords.latitude);
      // console.log(position.coords.longitude);

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
    // ,
    // // If there's an error, timeout after 3 seconds
    // options
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
      gridSize: 100,
      styles: [
        {
          height: 53,
          width: 53,
          url: "../static/images/m1.svg",
          textColor: "gray",
        },
        {
          height: 53,
          width: 53,
          url: "../static/images/m2.svg",
          textColor: "white",
        },
        {
          height: 65,
          width: 65,
          url: "../static/images/m3.svg",
          textColor: "white",
        },
      ],
    });
  });
}

// **************** Toggle Hide/Show all map markers (and clusters) ****************

// 1. CLEAR all the markers from the map
function clearMarkers() {
  // Make all the markers Invisible
  for (var i = 0; i < global_markers.length; i++) {
    global_markers[i].setVisible(false);
  }
  markerCluster.repaint();
}

// 2. SHOW all the markers from the map
function showMarkers() {
  // Make all the markers Visible
  for (var i = 0; i < global_markers.length; i++) {
    global_markers[i].setVisible(true);
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
    console.log("Geolocation is not supported or enabled.");
    map.panTo(userLatLng);
  }
}

// ================================ ATTRACTIONS ==============================================

// Array that will be used for the switch button that displays the attractions
// When the switch is off, it uses this array to remove the markers
var attractionsArray = [];

// The switch button calls this function on change to display the attractions on the map
function displayAttractions() {
  // toggleMarkerVisibility();
  setMapDublin(); // Center the map in Dublin
  // Check the value of the switch button
  var switchValue = document.getElementsByClassName("attractions-switch")[0]
    .checked
    ? true
    : false;
  if (switchValue) {
    clearMarkers();
    // Loop through the attractions in the JSON file and add marker for each to the map
    for (var i = 0; i < attractions.length; i++) {
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
    showMarkers();
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
  map.setZoom(14);
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
  let outputHTML = `<div id="bus-stop-info-container" style="max-height:200px; overflow:scroll;">
                      <h4>#${stopNum}</h4>
                      <table class="table table-sm table-hover">
                        <thead class="thead-light">
                          <tr>
                            <th>Route</th>
                            <th>Destination</th>
                            <th>Due</th>
                          </tr>
                        </thead>
                        <tbody>
                    `;

  // If the API call was successful, and we got an array of objects, then fill the info window content with the data
  if (objects.length > 0) {
    for (i = 0; i < objects.length; i++) {
      console.log(objects[i]);
      // Tabular Version
      outputHTML += `
        <tr>
          <td>${objects[i]["route"]}</td>
          <td>${objects[i]["destination"]}</td>
          <td>${objects[i]["due"]}</td>
        </tr>
      `;
    }
    outputHTML += `   </tbody>
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
  var switchValue = document.getElementsByClassName("users-location-switch")[0].checked ? true : false;
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
    // Else set them to Dublin
    alert("Geolocation is not supported or enabled.");
    setMapDublin();
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
      // console.log("here okay??");
      // server request is OK, set the renderer to use the result to display the directions on the renderer's designated map and panel.
      directionsDisplay.setMap(map);

      // *******This is what we want to replace*******
      directionsDisplay.setDirections(result);
    } else {
      alert("There was a problem with calculating your route");
    }
    // console.log("in the calc_function");

    // Directions timeline to be displayed when the user searches by location
    // journey is contained within first leg [0]
    let legs = result.routes[0].legs[0];
    let departure_time = legs.departure_time.text;
    let arrival_time = legs.arrival_time.text;
    let duration = legs.duration.text;
    let distance = legs.distance.text;
    let steps = legs.steps;

    // console.log(steps);

    var timeline = `<div class="timeline">`;
    
    steps.forEach(function(step, index) {
      if(step.travel_mode == 'WALKING') {
        timeline += `<div class="timeline-row">` +
                      `<div class="step-left">${step.duration.text}<br>${step.distance.text}</div>` +
                      `<div class="step-right walking">${step.instructions}</div>` + 
                    `</div>`;
      } else if (step.travel_mode == 'TRANSIT') {
        timeline += `<div class="timeline-row">` +
                      `<div class="step-left">${step.duration.text}<br>${step.distance.text}</div>`;
        if (step.transit.line.agencies[0].name == 'Dublin Bus') {
          timeline += `<div class="step-right dublin-bus">` +
                        `<p>Take the ${step.transit.line.short_name} ${step.instructions}<br>` + 
                        `Exit at: <b>${step.transit.arrival_stop.name}</b></p>` + 
                      `</div>` + 
                    `</div>`;
        } else if (step.transit.line.short_name == 'Dart') {
          timeline += `<div class="step-right dart">` +
                        `<p>${step.instructions}<br>` + 
                        `Exit at: <b>${step.transit.arrival_stop.name}</b></p>` + 
                      `</div>` + 
                    `</div>`;
        } else {
          timeline += `<div class="step-right undefined-step">`;
          if (step.transit.arrival_stop.name) {
            timeline += `<p>Take the ${step.transit.line.short_name} ${step.instructions}<br>` + 
                        `Exit at: <b>${step.transit.arrival_stop.name}</b></p>` + 
                      `</div></div>`;
          } else {
            timeline += `${step.instructions}</div></div>`;
          }         
        }     
      };
    });
    timeline += `<div class="timeline-row">` +
                  `<div class="step-left"></div>` +
                  `<div class="step-right final-step"></div>` + 
                `</div>` +
                `<div><h6>Duration: ${duration}</h6><h6>Distance: ${distance}</h6>` +
                `<h6>Arrival Time: ${arrival_time}</h6></div>` + 
              `</div>`;
 
    document.getElementById("journey-details").innerHTML = timeline;
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
function getRoutePolyline(path) {
  // First of all remove existing polylines
  try {
    route_polyline.setMap(null);
  } catch (err) {
    console.log("ERR in getRoutePolyline");
  }

  // console.log("path:", path[0]);
  // console.log("path last:", path[path.length - 1]);
  // Path is an array if lists with [0-lat,1-long]
  var start = new google.maps.LatLng(path[0][0], path[0][1]);
  var end = new google.maps.LatLng(
    path[path.length - 1][0],
    path[path.length - 1][1]
  );
  // console.log("start, finish", start, end);
  // get time of route
  var selectedRoute = document.getElementById("json-routes").value;
  // make query to dictionary for relevant time - have to load full dictionary in each time?? - gonna be slow
  // $.getJSON("./static/timetable.json", function (timetable) {
  //   console.log(timetable);
  //   // get the first time of the first stop on the first day (probably monday) - just for drawing purposes
  //   var request_time = timetable[selectedRoute]["D1"]["0"][0];
  //   // convert time into date format and conver to epoch time (for request) - https://www.w3schools.com/jsref/jsref_obj_date.asp
  //   // var d = new Date(1978,07,01,02,30,00);
  //   // var myEpoch = d.getTime()/1000.0;
  // });

  var request = {
    origin: start,
    destination: end,
    travelMode: "TRANSIT",
    provideRouteAlternatives: true,
    transitOptions: {
      modes: ["BUS"],
      routingPreference: "FEWER_TRANSFERS",
    },
  };
  directionsService.route(request, function (result, status) {
    if (status == "OK") {
      selectedRoute;

      var routes = result.routes;
      // console.log("routes: ", routes);
      var polyLine_Path = checkRouteLine(routes, selectedRoute);
      // check if it got back a viable result, if undefined, use just route coordinates as the polyline (not ideal but better than nothing)
      if (typeof polyLine_Path == "undefined") {
        console.log("No goodle maps -> undefined");
        // conver lat long to latlng objects
        var converted_path = [];
        for (x = 0; x < path.length; x++) {
          try {
            var temp = new google.maps.LatLng(path[x][0], path[x][1]);
            converted_path.push(temp);
          } catch (err) {
            console.log("err value at index: ", x);
          }
        }
        var snappedPolyline = new google.maps.Polyline({
          path: converted_path,
          strokeColor: "#add8e6",
          strokeWeight: 4,
          strokeOpacity: 0.9,
        });
      } else {
        console.log("USE GOOGLE MAPS - not undefined");
        console.log(polyLine_Path.length);
        // now put it on the map
        var snappedPolyline = new google.maps.Polyline({
          path: polyLine_Path,
          strokeColor: "#add8e6",
          strokeWeight: 4,
          strokeOpacity: 0.9,
        });
      }
      console.log(" POLYLINE:  ", snappedPolyline);
      // variable with global scope
      snappedPolyline.setMap(map);
      route_polyline = snappedPolyline;

      console.log("Check 1: Polyline set: ", typeof snappedPolyline);
      console.log("polyline in variable:", route_polyline);
    }
  });
}
function checkRouteLine(routes, selectedRoute) {
  // Function checks for route directions for this selected route and if so saves the polyline and returns the 'path' which is a series of latlngs I believe
  console.log("in checkRouteLine");
  var path;
  for (i = 0; i < routes.length; i++) {
    var steps = routes[i].legs[0].steps;
    // console.log(steps);
    // check if 'bus' is in the instructions
    for (x = 0; x < steps.length; x++) {
      if (steps[x]["instructions"].includes("Bus")) {
        if (steps[x]["transit"]["line"]["short_name"] == selectedRoute) {
          console.log("inner loop");
          // this means we are good homie - save the path
          path = steps[x]["path"];
          // essentially returning the first instance of this route - not always gonna work?
          return path;
        }
      }
    }
  }
}
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
  // clear polyline variable - put into try catch for the first time it will be undefined
  try {
    route_polyline.setMap(null);
  } catch (err) {
    console.log("ERR in showJourney function");
  }
  // empty route_coordinates variab;e
  route_coordinates.length = 0;
  // get coordinates of journey
  var bounds = new google.maps.LatLngBounds();
  for (i = 0; i < stopArray.length; i++) {
    let lat = stopArray[i]["lat"];
    let long = stopArray[i]["long"];
    // skip stops that have 'N/A' stop locations
    if (lat == "N/A" || long == "N/A") {
      console.log("we got a lat/long issue: ", lat, long);
      // skip current iteration
      continue;
    }
    let busLatLng = { lat: lat, lng: long };
    var markers = []; //some array
    // set the bounds to cover the route (i.e. fit in the route) - this should make viewport change to route
    var temp = new google.maps.LatLng(lat, long);
    // add coordinates to array for use in polyline
    route_coordinates.push([lat, long]);
    // add latlong to bounds
    bounds.extend(temp);
    // Set first and last stops to have different colours
    if (i == 0) {
      // Start stop
      var busStopIcon = {
        url: "./static/images/bus_stop_icon_green.svg",
        scaledSize: new google.maps.Size(25, 25),
        anchor: new google.maps.Point(12.5, 12.5),
      };
    } else if (i == stopArray.length - 1) {
      // End stop
      var busStopIcon = {
        url: "./static/images/bus_stop_icon_red.svg",
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
      label: i.toString(),
    });
    // console.log("what does a marker look like:", RouteMark);
    // Push each marker of the journey to the array
    FullRouteMarkers.push(RouteMark);
  }
  console.log("finsihed function getJourney");
  // get snapped to road coordinates
  getRoutePolyline(route_coordinates);

  map.fitBounds(bounds);
}

function filterDropdown() {
  // Function to filter the second option based on the value of the first dropdown (first dropdown will always contain all elements - second all from one stop after first)

  // Need a conditional - and to run this function in mapjs (call filter dropdown in filter route or vica cersa - otherwise messes up functionality - finalize values before filter route continues)
  //  If start index is less than stop index - just need to subtly remove the options from the stop index that are before start index (i.e. remove html options)
  // if start index is equal to or greater than stop index - need to do whats done below i.e. empty stop dropdown and replace it with new slice (automatically make stop the last stop - will help wiht polyliens)
  // if you have a small slice then put start index back to the start - how does the end index options go back again (while maintaining current value?)
  // Get route selected
  var selected_route = document.getElementById("json-routes").value;
  // get first stop
  var json_starting_point_dropdown = document.getElementById(
    "json-starting-stops"
  );
  var json_ending_point_dropdown = document.getElementById("json-ending-stops");
  // Function gets filtered journey and display this sub route on the map
  filterRoute();
  var start_value = json_starting_point_dropdown.value;
  var end_value = json_ending_point_dropdown.value;
  var start_num = parseInt(start_value);
  var end_num = parseInt(json_ending_point_dropdown.options[0].value);
  // if start index is still before end index, just need to remove the options from end index
  if (start_num < end_value) {
    console.log("end first value", end_num);
    // console.log(typeof start_value);
    // need to check if start node is going back towards origin (i.e. will need to add to end node), or going towards destination (just need to remove nodes from end)
    // Use the value of the first index in the end dropwdown as a guide
    if (start_num + 1 < end_num) {
      // This means the current end list needs to be increased - i.e. add on untill start_value + 1 == json_ending_point_dropdown.optons[0].value
      // get info from start list of what needs to be added
      var options_arr = [];
      var count = 0;
      for (i = 0; i < end_num; i++) {
        // loop through all start dropdown optiions and add all that are after start point but before the end point stop to array
        if (
          parseInt(json_starting_point_dropdown.options[i].value) >
          parseInt(start_value)
        ) {
          var remove = json_starting_point_dropdown.options[i].cloneNode(true);
          console.log("add:", remove);
          json_ending_point_dropdown.options.add(remove, count);
          count += 1;
        }
      }
    } else {
      console.log("B needs to reduce");

      // remove all options up to and including start value in end dropdown options
      // start from the first index but check the value each time
      var count = 0;
      for (i = 0; i <= start_num; i++) {
        if (json_ending_point_dropdown.options[i].value <= start_num) {
          count += 1;
        }
      }
      // remove that many options
      for (x = 0; x < count; x++) {
        console.log("remove: ", json_ending_point_dropdown.options[0]);
        json_ending_point_dropdown.options.remove(0);
      }
    }
  }
}

function filterRoute() {
  console.log("in filter route!");
  // At this point there is a path array which contains the full route options are:
  // A. Try to still use this array/polyline but reduce it
  // B. redo request with new values (alot more requests - quicker fix for now)
  var start = parseInt(document.getElementById("json-starting-stops").value);
  var end = parseInt(document.getElementById("json-ending-stops").value);
  // Remove any existing polyline
  try {
    route_polyline.setMap(null);
  } catch (err) {
    console.log("ERR in filterRoute function");
  }

  // empty coordinates variable
  route_coordinates.length = 0;
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
      console.log("checking", FullRouteMarkers[x].getPosition().lat());
      route_coordinates.push([temp.lat(), temp.lng()]);

      bounds.extend(temp);
      // changing markers
      // set new end and start stop markers
      // Set first and last stops to have different colours
      if (x == start) {
        // Start stop
        var busStopIcon = {
          url: "./static/images/bus_stop_icon_green.svg",
          scaledSize: new google.maps.Size(25, 25),
          anchor: new google.maps.Point(12.5, 12.5),
        };
        FullRouteMarkers[x].setIcon(busStopIcon);
      } else if (x == end) {
        console.log("end");
        // End stop
        var busStopIcon = {
          url: "./static/images/bus_stop_icon_red.svg",
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
  console.log("route coords: ", route_coordinates);
  getRoutePolyline(route_coordinates);
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

      bus_stop_location = new google.maps.LatLng(stop_lat, stop_long);

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

  for (let i = 0; i < all_searched_bus_stop_markers.length; i++) {
    console.log(all_searched_bus_stop_markers[i]);
    all_searched_bus_stop_markers[i].setMap(null);
  }
  all_searched_bus_stop_markers.length = 0;

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

          // var seach_by_busstop_icon = {
          //   // url: './static/images/search_by_stop_icon.png',
          //   url: "./static/images/bus_stop_icon.svg",
          //   scaledSize: new google.maps.Size(25, 25),
          //   anchor: new google.maps.Point(12.5, 12.5),
          // };
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

        // // Set a marker for the bus stop that was searched
        // searched_bus_stop_marker = new google.maps.Marker({
        //   position: bus_stop_location,
        //   map: map,
        //   title: stop_num,
        //   animation: google.maps.Animation.DROP,
        // });

        map.setCenter(bus_stop_location);
        map.setZoom(13);
        console.log("----END of Stops Loop----");

        // Add each polyline to the list of polylines
        all_polylines.push(polyline);
      }

      // console.log(all_routes[route_num]);
    }
  }

  // Set a marker for the bus stop that was searched
  searched_bus_stop_marker = new google.maps.Marker({
    position: bus_stop_location,
    map: map,
    title: stop_num,
    animation: google.maps.Animation.DROP,
  });

  // searched_bus_stop_marker.setPosition(bus_stop_location);
  // searched_bus_stop_marker.setAnimation(google.maps.Animation.DROP);
  // searched_bus_stop_marker.setTitle(stop_num);

  all_searched_bus_stop_markers.push(searched_bus_stop_marker);

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

// Function to hide or show the search menu. Called on click
function hideMenu() {
  if (menu_visibility) {
    document.getElementById("search-menu-container").style.left = "-330px";
    menu_visibility = false;
    document.getElementById("hide-arrow").style.transform = "rotate(0deg)";
  } else {
    document.getElementById("search-menu-container").style.left = "20px";
    menu_visibility = true;
    document.getElementById("hide-arrow").style.transform = "rotate(180deg)";
  }
}
