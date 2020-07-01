function initMap() {

    var map = new google.maps.Map(document.getElementById('map'));
    
    navigator.geolocation.getCurrentPosition(function(position) {
      // Center map on user's current location if geolocation prompt allowed
      var usersLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      map.setCenter(usersLocation);
      map.setZoom(15);
      
      var marker = new google.maps.Marker({
        position: usersLocation,
        map: map,
      });
    }, function(positionError) {
      // Default to Dublin if user denied geolocation prompt
      map.setCenter(new google.maps.LatLng(53.346, -6.26));
      map.setZoom(12);
    });

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
  }

  