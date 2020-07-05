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
        scaledSize: new google.maps.Size(30, 30), // scaled size
        anchor: new google.maps.Point(12.5, 12.5) // anchor
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

      var markers = stops.map(function(location, i) {
        var stopCoords = new google.maps.LatLng(location.latitude, location.longitude);
        return new google.maps.Marker({
          position: stopCoords,
        });
      });
  
      // Add a marker clusterer to manage the markers.
      var markerCluster = new MarkerClusterer(map, markers,
          {imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'});
    });
    
  }


  