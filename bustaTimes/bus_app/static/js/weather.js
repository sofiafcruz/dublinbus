var temperature = weather[0].temperature;
var iconName = weather[0].icon;

if (typeof temperature === 'number') {
    // Add temperature value to the page
    document.getElementById('temperature').innerHTML += weather[0].temperature + ' ºC '; 

    // Display alert when the temperature is below 5 degrees
    if(temperature <= 5) {
        document.querySelector('.alert-cold').style.display = 'flex';
        setTimeout(function(){
            document.querySelector('.alert-cold').style.display = 'none';
        }, 6000);
    }

    // Display alert when it's raining
    if(iconName === 'rain') {
        document.querySelector('.alert-rain').style.display = 'flex';
        setTimeout(function(){
            document.querySelector('.alert-rain').style.display = 'none';
        }, 6000);
    }
    // 
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

