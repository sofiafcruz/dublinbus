var temperature = weather[0].temperature;

if (typeof temperature === 'number') {
    // Add temperature value to the page
    document.getElementById('temperature').innerHTML += weather[0].temperature + ' ºC '; 
    
    // var iconName = weather[0].icon;
    // console.log(iconName);
    // // Check if there's icon for the current weather
    // var url = './static/images/weather/' + iconName + '.png';
    // console.log(url);
    // $.get(url)
    //     .done(function() { 
    //         document.getElementById('temperature').innerHTML += '<img src="' + url + '" alt="' + iconName + '" style="width:40px">'; 
    //     }).fail(function() { 
    //         document.getElementById('temperature').innerHTML += '<img src="./static/images/unknown.png" alt="' + iconName + '" style="width:40px">'; 
    //     })
} else {
    document.getElementById('weather-container').innerHTML = '';
}

