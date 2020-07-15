$(document).ready(function() {
  // Onclick Event for Button to Toggle the Map View;
  // BUT DOESN'T WORK WHEN YOU PLAN YOUR ROUTE WITH SEARCH BY ROUTE!
  $('#toggle-nightmode').click(function() {
    if (map.mapTypeId !== "hybrid") {
      map.setMapTypeId(google.maps.MapTypeId.HYBRID);  
    } else{
      map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
    }
  });
});

var map;
var destinationMarkers = [];
var directionsService;
var directionsRenderer;
// Variable to keep track of the current opened info window for the attractions
var lastOpenedAttraction;
// Variable to keep track of the current opened info window for the bus stops
var lastOpenedBusStop;

// Reads the JSON with the attractions info
var xmlhttp = new XMLHttpRequest();
var url = "./static/attractions.json";
var attractions = null;
xmlhttp.onreadystatechange = function() {
    if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
      attractions = JSON.parse(xmlhttp.responseText);
    }
};
xmlhttp.open("GET", url, true);
xmlhttp.send();

// Sets the map on all Destination markers in the array.
function setMapOnAll(map) {
  for (var i = 0; i < destinationMarkers.length; i++) {
    destinationMarkers[i].setMap(map);
  }
}

function initMap() {
  map = new google.maps.Map(document.getElementById('map'));
  
  // Disabling double-clicking zoom feature;
  map.setOptions({disableDoubleClickZoom: true });
  
  // Add marker on DOUBLE click (Will be used later for adding origin and destination points)
  map.addListener('dblclick', function(e) {
    placeDestinationMarker(e.latLng, map);
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
  // origin_autocomplete.addListener('place_changed', onPlaceChanged(origin_autocomplete));

  // (Destination)
  destination_autocomplete = new google.maps.places.Autocomplete(
    document.getElementById("destination-home-search"),
    {
      componentRestrictions: {"country": ["IE"]},
      fields: ["place_id", "geometry", "name"]
    }
  );
  // destination_autocomplete.addListener('place_changed', onPlaceChanged(destination_autocomplete));
  
  // function onPlaceChanged(autocomplete) {
  //   var place = autocomplete.getPlace();

  //   if (!place.geometry) {
  //     // User didn't select a prediction or entered an incorrect result, so reset the input field
  //     document.getElementById(autocomplete).placeholder = "Enter a place";
  //   } else{
  //     // Display details about the valid place
  //     document.getElementById(autocomplete).innerHTML = place.name;
  //   }
  // }

  // Variables to be used for the directions 
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
    preserveViewport: false
  });
  // map.setCenter(new google.maps.LatLng(53.346, -6.26));
  // map.setZoom(12);

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
    var marker = new google.maps.Marker({
      position: usersLocation,
      map: map,
      icon: icon
    });
  }, function(positionError) {
    // Default to Dublin if user denied geolocation prompt
    map.setCenter(new google.maps.LatLng(53.346, -6.26));
    map.setZoom(12);
  });

  var busStopIcon = {
    url: './static/images/bus_stop_icon.svg',
    scaledSize: new google.maps.Size(25, 25), 
    anchor: new google.maps.Point(12.5, 12.5) 
  };

  // Loading the bus stops and adding them to the map
  $.getJSON("./static/bus_stops.json", function(stops) {
    var markers = stops.map(function(location, i) {
      var stopCoords = new google.maps.LatLng(location.latitude, location.longitude);
      var marker = new google.maps.Marker({
        position: stopCoords,
        icon: busStopIcon,
        title: location.stop_num // Title is each marker's stop num (which we can use to generate time table for info window)
      });
      stopsInfowindow(marker);
      return marker;
    });

    // Add a marker clusterer to manage the markers.
    var markerCluster = new MarkerClusterer(map, markers,
        {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
  });
}

function stopsInfowindow(marker) {
  var infowindow = new google.maps.InfoWindow();
  marker.addListener('click', function() {
    // eventuallySetInfoWindowContent(marker.title);
    closeLastOpenedInfoWindow(lastOpenedBusStop);
    // Set Window to due info;
    infowindow.setContent(eventuallySetInfoWindowContent(marker.title));
    // console.log(eventuallySetInfoWindowContent(marker.title));
    infowindow.open(map, marker);
    lastOpenedBusStop = infowindow;
  })
}

function eventuallySetInfoWindowContent(stopNum) {
  console.log("This stop's number is:", stopNum);

  $.ajax({
      url: 'trying_to_access_third_party_api',
      type: 'GET',
      data: {
        inputStopNum: stopNum
      },
      success: function(result) {
        parsed_realtime_info = JSON.parse(result)
        console.log(parsed_realtime_info);
        let InfoWindowHTML;
      },
      error: function(error) {
        console.log(`Error ${error}`)
      },
  }).done(function(parsed_realtime_info) {
    return(parsed_realtime_info); // Not sure what the use of this is!
  });
  console.log("BEFORE");
  // console.log(parsed_realtime_info);
  console.log("AFTER");
  // return(parsed_realtime_info); // NOT WORKING!
}

// Meant to remove all markers from the map each time a new journey is selected (but not working)
// My Logic is wrong somewhere...
// ----------------------------------------------------------------------------------------------
// function clearOverlays(arr) {
//   for (var i = 0; i < arr.length; i++ ) {
//     arr[i].setMap(null);
//   }
//   arr.length = 0;
// }

// CODE TO SET MAP TO WHATEVER JOURNEY IS SEARCHED (outside of init function) 
// var map = new google.maps.Map(document.getElementById('map'));
function showJouneyOnMap(arrOfStopObjs){
  // console.log("INSIDE showJouneyOnMap function!")
  var markersArray = [];

  for (var i = 0; i < arrOfStopObjs.length; i++) {
    let bus_stop_obj = arrOfStopObjs[i]; // Bus Stop object
    let bus_stop_num = Object.keys(bus_stop_obj)[0]; // Bus Stop number
    let bus_stop_properties = Object.values(bus_stop_obj)[0]; // Properties of bus stop (prog num, lat, long, address)

    let bus_stop_lat = bus_stop_properties.latitude;
    let bus_stop_long = bus_stop_properties.longitude;

    let busLatLng = { lat: bus_stop_lat, lng: bus_stop_long };

    var busStopIcon = {
      url: './static/images/bus_stop_icon.svg',
      scaledSize: new google.maps.Size(25, 25), 
      anchor: new google.maps.Point(12.5, 12.5) 
    };
    // Create a marker of that lat and long
    var marker = new google.maps.Marker({
      position: busLatLng,
      map: map,
      icon: busStopIcon
    });
    
    // Add info window to the bus stop
    attachInfoWindow(marker, bus_stop_num, bus_stop_lat, bus_stop_long);
    
    markersArray.push(marker);

  }  
  // Calls the function to display the directions on the map
  directionsRenderer.setMap(map); 
  calcRoute();
}

// Function to add info window to each marker;
function attachInfoWindow(marker, stopNum, latitude, longitude) {
  var infowindow = new google.maps.InfoWindow({
    content: "BUS STOP NUM: " + stopNum + "<br>" + "LAT: " + latitude + "<br>" + "LONG: " + longitude
  });

  marker.addListener("click", function() {
    infowindow.open(marker.get("map"), marker);
  });
}

// 'arrOfCoords' comes from app.js
// Function to draw the directions on the map
function calcRoute() {
  var start = new google.maps.LatLng(arrOfCoords[0].latitude,arrOfCoords[0].longitude);
  var end = new google.maps.LatLng(arrOfCoords[arrOfCoords.length - 1].latitude,arrOfCoords[arrOfCoords.length - 1].longitude);
  
  console.log("CALC-ROUTE START");
  console.log(arrOfCoords[0].latitude);
  console.log(arrOfCoords[0].longitude);
  console.log("CALC-ROUTE END");
  console.log(arrOfCoords[arrOfCoords.length - 1].latitude);
  console.log(arrOfCoords[arrOfCoords.length - 1].longitude);
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
    console.log(typeof result);
    console.log(result);
    console.log(result.routes);
    console.log(result.routes[0]);
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
          directionsRenderer.setDirections(result);
          directionsRenderer.setRouteIndex(i);
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

// Get User's Geolocation and plug its Geocode into Origin;
$("#my-location-btn-img").click(function(e) {
  e.preventDefault();
  console.log("clicked");
  if (navigator.geolocation) {
    console.log(navigator.geolocation.getCurrentPosition(logSuccessAndPopulateOrigin));
  } else { 
    console.log("Geolocation is not supported by this browser.");
  }
});

function logSuccessAndPopulateOrigin(pos) {
  var coordinates = pos.coords;

  console.log('Your current position is:');
  console.log(`Latitude : ${coordinates.latitude}`);
  console.log(`Longitude: ${coordinates.longitude}`);
  console.log(`More or less ${coordinates.accuracy} meters.`);

  // Reverse Geocode the Coordinates into the Place name;
  var geocoder = new google.maps.Geocoder();

  var latlng = { lat: coordinates.latitude, lng: coordinates.longitude };
  geocoder.geocode({ location: latlng }, function(results, status) {
    if (status === "OK") {
      if (results[0]) {
        // Set the value of the user's coordinated to the inner HTML of origin
        document.getElementById("origin-home-search").value = results[0].formatted_address;
      }
    }
  });
}

// Render directions based on origin and destination (COORDINATES, NOT PLACE NAMES) on home tab;
const calculateAndRenderDirections = (origin, destination) => {

  let directionsService = new google.maps.DirectionsService();
  let directionsDisplay = null;
  let request = {
    origin: origin,
    destination: destination,
    travelMode: 'TRANSIT'
  };

  // This is meant to clear past rendered routes (BUT NOT WORKING!)
  // if (directionsDisplay != null) {
  //   directionsDisplay.setMap(null);
  //   directionsDisplay = null;
  // }

  directionsDisplay = new google.maps.DirectionsRenderer();

  directionsDisplay.setMap(map);
  directionsService.route(request, (result, status) => {
    if (status == "OK") {
      directionsDisplay.setDirections(result);
    }
    
    // DEALING WITH MESSAGE PRINTOUT FOR USERS
    // console.log(result);
    // console.log(result.routes[0].legs[0]);
    let legs = result.routes[0].legs[0];
    let departure_time = legs.departure_time.text;
    let arrival_time = legs.arrival_time.text;
    let duration = legs.duration.text;
    let distance = legs.distance.text;

    let steps = legs.steps;

    console.log(legs);
    console.log("Total Journey Details");
    console.log("=====================");
    console.log("Departure Time:", departure_time);
    console.log("Arrival Time:", arrival_time);
    console.log("Total Duration:", duration);
    console.log("Total Distance:", distance);
    console.log(steps);

    journey_details_div = document.getElementById('journey-details')

    let today = new Date();
    let suffix = "am";
    if (today.getHours() >= 12) {
      suffix = "pm";
    }
    let current_time = today.getHours()-12 + "." + today.getMinutes() + suffix;

    journey_details_div.innerHTML = `
      <h6>Total Journey Details</h6>
      <p>Current Time: ${current_time}</p>
      <p>Departure Time: ${departure_time}</p>
      <p>Arrival Time: ${arrival_time}</p>
      <p>Total Duration: ${duration}</p>
      <p>Total Distance: ${distance}</p>
      <h6>Details of Each Step:</h6>
    `;

    steps.forEach(function (step, index) {
      // console.log("Step:", index+1);
      // console.log("========");
      // console.log("Distance:", step.distance.text);
      // console.log("Duration:", step.duration.text);
      // console.log("Instructions:", step.instructions);
      journey_details_div.innerHTML += `
        <div>
        <b>Step: ${index+1} (${step.travel_mode} for ~${step.duration.text})</b>
        <p>${step.instructions}</p>
        <p>Distance: ${step.distance.text}</p>
        </div>
      `;
    });

    document.getElementById("journey-details").className = "journey-details"
  });

  
}

// When the submit button is clicked;
// document.getElementById("home-submit")

$("#home-submit").click(function(e) {
  // Disable submit button from reloading the page when clicked
  e.preventDefault();

  // var map = new google.maps.Map(document.getElementById('map'));
  // var start = new google.maps.LatLng(53.345941, -6.276008999999999);
  // var end = new google.maps.LatLng(53.31832389, -6.23055);
  var start = document.getElementById('origin-home-search').value;
  var end = document.getElementById('destination-home-search').value;

  calculateAndRenderDirections(start, end);

  // console.log("CALC-ROUTE START");
  // console.log(start);
  
  // console.log("CALC-ROUTE END");
  // console.log(end);
  
  // console.log("=================================================================================================");
  // var request = {
  //   query: start,
  //   fields: ['name', 'geometry'],
  // };
  // console.log(request);

  // var service = new google.maps.places.PlacesService(map);

  // service.findPlaceFromQuery(request, function(results, status) {
  //   if (status === google.maps.places.PlacesServiceStatus.OK) {
  //     for (var i = 0; i < results.length; i++) {
  //       console.log(results);
  //       // createMarker(results[i]);
  //     }
  //     map.setCenter(results[0].geometry.location);
  //   }
  // });
});

// function homeSearch() {
//   var map = new google.maps.Map(document.getElementById('map'));
//   // var start = new google.maps.LatLng(53.345941, -6.276008999999999);
//   // var end = new google.maps.LatLng(53.31832389, -6.23055);
//   var start = document.getElementById('origin-home-search').value;
//   var end = document.getElementById('destination-home-search').value;
//   console.log("CALC-ROUTE START");
//   console.log(start);
  
//   console.log("CALC-ROUTE END");
//   console.log(end);
  
//   console.log("=================================================================================================");
//   var request = {
//     query: start,
//     fields: ['name', 'geometry'],
//   };
//   console.log(request);

//   var service = new google.maps.places.PlacesService(map);

//   service.findPlaceFromQuery(request, function(results, status) {
//     if (status === google.maps.places.PlacesServiceStatus.OK) {
//       for (var i = 0; i < results.length; i++) {
//         console.log(results);
//         // createMarker(results[i]);
//       }
//       map.setCenter(results[0].geometry.location);
//     }
//   });

  // var request = {
  //   origin: start,
  //   destination: end,
  //   travelMode: 'TRANSIT',
  //   transitOptions: {
  //     modes: ['BUS']
  //   } 
  // };

  // directionsService.route(request, function(result, status) {
  //   if (status == 'OK') {
  //     directionsRenderer.setDirections(result);
  //   }
  //   console.log(typeof result);
  //   console.log(result);
  //   // console.log(result.routes);
  //   // console.log(result.routes[0]);
  //   // console.log(result.routes[0].legs[0].steps[1].transit.line.short_name);
  // });
// }

// Array that will be used for the switch button that displays the attractions
// When the switch is off, it uses this array to remove the markers
var attractionsArray = []

// The switch button calls this function on change to display the attractions on the map
function displayAttractions() {
  // Check the value of the switch button
  var switchValue = document.getElementsByClassName("custom-control-input")[0].checked ? true : false
  if (switchValue) { 
    // Loop through the attractions in the JSON file
    for (i = 0; i < attractions.length; i++) {
      var latitude = parseFloat(attractions[i].latitude);
      var longitude = parseFloat(attractions[i].longitude);
      var marker = new google.maps.Marker({
        position: new google.maps.LatLng(latitude, longitude),
        title: attractions[i].title,
        map: map
      });
      // Function to add an on click event to display an info window
      attractionsInfowindow(marker, attractions[i].title);
      
      attractionsArray.push(marker);
    };
  } else {
    for (i = 0; i < attractionsArray.length; i++) {
      attractionsArray[i].setMap(null);
    };
  };
};

// Display the info window for each attraction
function attractionsInfowindow (marker, title) {
  var infowindow = new google.maps.InfoWindow({
    maxWidth: 250
  });
  marker.addListener('click', function() {
    // Function to check whether there is an opened info window, if so closes it
    closeLastOpenedInfoWindow(lastOpenedAttraction);

    var summary, image, url, latitude, longitude;

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
    '<a href="#" onclick="">Directions</a>'+
    '<div class="attractions-image"><img src="' + image + '" alt="' + title + '" style="max-width:250px; max-height:250px;"></div>' + 
    '<div id="attractions-bodyContent">'+
    '<p class="attractions-summary">' + summary + '&nbsp;<a href="' + url + '">More Info</a></p>'+
    '</div>'+
    '</div>';
    infowindow.setContent(contentString);
    infowindow.open(map, marker);
    lastOpenedAttraction = infowindow;
  });
}

// Close the previous info window when a new marker is clicked
// Both the attractions and the bus stops info windows are using this function
function closeLastOpenedInfoWindow(lastOpened) {
  if (lastOpened) {
    lastOpened.close();
  }
}

// For setting destination marker (in Home tab):
function placeDestinationMarker(latLng, map) {

  var icon = {
    url: './static/images/target.png',
    scaledSize: new google.maps.Size(50, 50), 
    anchor: new google.maps.Point(12.5, 12.5) 
  };

  var marker = new google.maps.Marker({
    position: latLng,
    map: map,
    icon: icon
  });
  
  // Clear destination marker when new location double clicked
  setMapOnAll(null);
  destinationMarkers = [];
  destinationMarkers.push(marker);

  var geocoder = new google.maps.Geocoder();
  var infowindow = new google.maps.InfoWindow();

  geocodeLatLng(latLng.lat(), latLng.lng(), geocoder, map, infowindow, marker);

}

// Converts the coordinate information of a double-clicked location on the map to its placename
function geocodeLatLng(latitude, longitude, geocoder, map, infowindow, marker) {
  var latlng = { lat: latitude, lng: longitude };
  geocoder.geocode({ location: latlng }, function(results, status) {
    if (status === "OK") {
      if (results[0]) {
        infowindow.setContent(results[0].formatted_address);
        infowindow.open(map, marker);
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

// google.maps.event.addListener(marker, 'click', function () {
//   // do something with this marker ...
//   this.getTitle();
//   console.log(this.getTitle());
//   console.log("Clicked");
// });

$("#bus-stop-marker").click(function(e) {
  // Go to realtime SD API and pull relevant info (about buses due etc)
  console.log("MARKER CLICKED!");
  let value = e.target.value; // Stop Num (i.e. 905)

  let real_time_url = 'https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?type=day&stopid=' + value;
  
  // ***********ISSUE WITH CORS!!!!!!!!!*************** // Info on CORS: https://web.dev/cross-origin-resource-sharing/

  // VERSION 1 (Worked at the beginning, BUT NOT ANYMORE)==========================================================================
  // let cors_heroku_url = 'https://cors-anywhere.herokuapp.com/'; 
  // let main_url = cors_heroku_url + real_time_url + "&format=json";
  // // let main_url = 'https://jsonplaceholder.typicode.com/posts'; // THIS DIFFERENT 3RD-PARTY API WORKS WITH NO ISSUES AND I AM NOT SURE WHY???!!!
  // $.ajax({
  //     url: main_url,
  //     dataType: 'json',
  //     contentType: "application/json",
  //     // set the request header authorization to the bearer token that is generated
  //     headers: {
  //       "X-Requested-With": "XMLHttpRequest"
  //     },
  //     success: function(result) {
  //       console.log(result);
  //       data = result;
  //       data["results"].forEach(extractInfo);
  //     },
  //     error: function(error) {
  //       console.log(`Error ${error}`)
  //     },
  // });

  // function extractInfo(result, index) {
  //   let route = result.route;
  //   let origin = result.origin;
  //   let destination = result.destination;
  //   let scheduledArrivalTime = result.scheduledarrivaldatetime;
  //   let likelyArrivalTime = result.arrivaldatetime;
  //   let dueTime = result.duetime;

  //   console.log(route, origin, destination, scheduledArrivalTime, likelyArrivalTime, dueTime);
  // }

  // // VERSION 2 (Doesn't work)==========================================================================
  // var settings = {
  //   'cache': false,
  //   'dataType': "jsonp",
  //   'async': true,
  //   "crossDomain": true,
  //   "url": real_time_url,
  //   "method": "GET",
  //   "headers": {
  //     "accept": "application/json",
  //     "Access-Control-Allow-Origin": "*"
  //   }
  // }

  // $.ajax(settings).done(function (response) {
  //   console.log(response);
  // })

  // VERSION 3 (Doesn't work)==========================================================================
  // fetch('https://data.smartdublin.ie/cgi-bin/rtpi/realtimebusinformation?type=day&stopid=905');
});