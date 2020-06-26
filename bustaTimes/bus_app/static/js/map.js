function initMap() {

    var map = new google.maps.Map(document.getElementById('map'));
  
    navigator.geolocation.getCurrentPosition(function(position) {
      // Center map on user's current location if geolocation prompt allowed
      var initialLocation = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
      map.setCenter(initialLocation);
      map.setZoom(15);
      
      var marker = new google.maps.Marker({
        position: initialLocation,
        map: map,
      });
    }, function(positionError) {
      // Default to Dublin if user denied geolocation prompt
      map.setCenter(new google.maps.LatLng(53.346, -6.26));
      map.setZoom(12);
    });
  }