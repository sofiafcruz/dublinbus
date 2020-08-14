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
        }, 10000);
    }

    // Display alert when it's raining
    if(iconName === 'rain') {
        document.querySelector('.alert-rain').style.display = 'flex';
        setTimeout(function(){
            document.querySelector('.alert-rain').style.display = 'none';
        }, 10000);
    }

} else {
    // If cannot get temperature leave container empty
    document.getElementById('weather-container').innerHTML = '';
}

