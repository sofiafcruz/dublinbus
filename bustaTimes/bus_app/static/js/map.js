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
var directionsService;
var directionsRenderer;

function initMap() {
  map = new google.maps.Map(document.getElementById('map'));
  
  // Variables to be used for the directions 
  directionsService = new google.maps.DirectionsService();
  directionsRenderer = new google.maps.DirectionsRenderer({
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
      return new google.maps.Marker({
        position: stopCoords,
        icon: busStopIcon,
      });
    });

    // Add a marker clusterer to manage the markers.
    var markerCluster = new MarkerClusterer(map, markers,
        {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
  });
  
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

// function homeSearch() {
//   var start = new google.maps.LatLng(53.345941, -6.276008999999999);
//   var end = new google.maps.LatLng(53.31832389, -6.23055);
  
//   console.log("CALC-ROUTE START");
//   console.log(start);
  
//   console.log("CALC-ROUTE END");
//   console.log(end);
  
//   console.log("=================================================================================================");
//   var request = {
//     origin: start,
//     destination: end,
//     travelMode: 'TRANSIT',
//     transitOptions: {
//       modes: ['BUS']
//     }
    
//   };

//   directionsService.route(request, function(result, status) {
//     if (status == 'OK') {
//       directionsRenderer.setDirections(result);
//     }
//     console.log(typeof result);
//     console.log(result);
//     // console.log(result.routes);
//     // console.log(result.routes[0]);
//     // console.log(result.routes[0].legs[0].steps[1].transit.line.short_name);
    
//   });
// }
