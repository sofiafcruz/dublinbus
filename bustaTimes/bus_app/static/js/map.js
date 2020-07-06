function initMap() {

    var map = new google.maps.Map(document.getElementById('map'));
    
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

    // Loading the bus stops and adding them to the map
    $.getJSON("./static/bus_stops.json", function(stops) {
      // for (i = 0; i < stops.length; i++) {
      //   addMarkers(stops[i]);
      // }
      
      // function addMarkers(newMarker) {
      //   var stopCoords = new google.maps.LatLng(newMarker.latitude, newMarker.longitude);
      //   var marker = new google.maps.Marker({
      //     position: stopCoords,
      //     map: map,
      //   });
      // }
      var busStopIcon = {
        url: './static/images/bus_stop_icon.svg',
        scaledSize: new google.maps.Size(25, 25), 
        anchor: new google.maps.Point(12.5, 12.5) 
      };

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
var map = new google.maps.Map(document.getElementById('map'));
function showJouneyOnMap(){
  
  var markersArray = [];

  // clearOverlays(markersArray);

  console.log(markersArray);
  // 'arrOfCoords' comes from app.js
  for (var i = 0; i < arrOfCoords.length; i++) {
    // initialise lat and long of each stop
    let bus_stop_lat = arrOfCoords[i].latitude;
    let bus_stop_long = arrOfCoords[i].longitude;

    let busLatLng = { lat: bus_stop_lat, lng: bus_stop_long };

    // Create a marker of that lat and long
    var marker = new google.maps.Marker({
      position: busLatLng,
      map: map,
      title: "TESTING POPULATING BUS STOPS!"
    });
    
    markersArray.push(marker);
  }
  map.setCenter(new google.maps.LatLng(arrOfCoords[0].latitude, arrOfCoords[0].longitude));
  map.setZoom(14);
}
