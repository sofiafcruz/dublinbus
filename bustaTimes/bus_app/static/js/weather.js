var temperature = weather[0].temperature;

if (typeof temperature === 'number') {
    // Add temperature value to the page
    document.getElementById('temperature').innerHTML += 'Dublin City, ' + weather[0].temperature + ' ºC '; 
    
    var iconName = weather[0].icon;
    // Check if there's icon for the current weather
    var url = './static/images/' + iconName + '.png';
    $.get(url)
        .done(function() { 
            document.getElementById('temperature').innerHTML += '<img src="' + url + '" alt="' + iconName + '" style="width:40px">'; 
        }).fail(function() { 
            document.getElementById('temperature').innerHTML += '<img src="./static/images/unknown.png" alt="' + iconName + '" style="width:40px">'; 
        })
} else {
    document.getElementById('weather-container').innerHTML = '';
}

