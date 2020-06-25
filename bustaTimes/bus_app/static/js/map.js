function initMap() {
    // Dublin Coordinates
    var dublinCoords = {lat: 53.346, lng: -6.26};
    // The map, centered at Dublin
    var map = new google.maps.Map(
        document.getElementById('map'), {zoom: 12, center: dublinCoords});
    
  }

