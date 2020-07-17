// ================================ SEARCH BY ROUTE ==============================================
// ********** Route Dropdown **********
$(document).ready(function(){
    // On page load, populate the Route Dropdown in 'Search by Route' section
    var json_routes_dropdown = document.getElementById("json-routes");
    for (var key in main_table_object) {
        var opt = document.createElement('option');
        opt.value = key; 
        opt.innerHTML = key;
        json_routes_dropdown.appendChild(opt);
    }
});

// ********** Div containing Journey Info, Starting and Ending Stop Dropdowns  **********
// Display div containing filled drop down options of bus stops
// (Has to be outside of on-load ($(document).ready) to allow for on click event to call this function)
function showAndLoadStartAndEndDrops() {
    // Grab the route option selected
    var selected_route = document.getElementById("json-routes").value;
    console.log(selected_route);
    // Grab the selected Route's Origin (From) and Destination (To) data
    let origin = route_origin_and_destination_object[selected_route]["origin"];
    let destination = route_origin_and_destination_object[selected_route]["destination"];
    // Set the header (From X to Y)
    $('#origin-to-destination-header').html("From " + origin + " to " + destination);
    // Target the starting and ending stops select dropdowns
    var json_starting_point_dropdown = document.getElementById("json-starting-stops");
    var json_ending_point_dropdown = document.getElementById("json-ending-stops");
    // Empty their contents EVERY call (or else values (stops) will be appended to them, rather than replacing them)
    $(json_starting_point_dropdown).empty();
    $(json_ending_point_dropdown).empty();
    // Need a nested for loop to grab the Address of each bus stop of the selected route
    for (index in main_table_object[selected_route]){
        for (bus_stop in main_table_object[selected_route][index]){
            // Grab the bus stop address
            stop_address = main_table_object[selected_route][index][bus_stop]["stop_address"];
            // Store it into an option element
            var opt = document.createElement('option');
            opt.value = index; // Value is the index of the bus stop
            opt.innerHTML = stop_address + " (" + bus_stop + ")";
            // Then clone it so it can also be appended to the Ending Stop dropdown
            var cloneOption = opt.cloneNode(true);
            // Append the current iteration's bus stop option to both starting and ending point dropdowns
            json_ending_point_dropdown.appendChild(opt);
            json_starting_point_dropdown.appendChild(cloneOption);
        }
    }
    // At the end, make sure to display the container holding the starting and ending stop dropdowns (as it's initially hidden)
    $('#stops-dropdowns-container').css('display', 'block');
}

// ********** Logic to grab all the Stops between the selected Starting and Ending Stops INCLUSIVE  **********
// Initialising Empty Array of Coords (initialised outside so can also be used in 'map.js')
var arrOfCoords = [];

function generateStopArray() {
    // Function to grab all the stops between Starting and Ending Points of Journey
    // Grab all selected dropdown components
    var selected_route = document.getElementById("json-routes").value;
    var selected_start = parseInt(document.getElementById("json-starting-stops").value);
    var selected_end = parseInt(document.getElementById("json-ending-stops").value);
    // console.log(selected_route + " - " + selected_start + " - " + selected_end);

    // Grab all the stops from the selected route from Starting Stop to Ending Stop INCLUSIVE
    var arrOfSelectedStops = main_table_object[selected_route].slice(selected_start, (selected_end+1));
    // console.log(arrOfSelectedStops);

    // arrOfCoords reinitialised to empty array (Can't remember why??)
    arrOfCoords = [];

    // Iterate over the array of selected stops, grab their coordinates, and store them as Coord objects in arrOfCoords 
    // (To be used in map.js for some reason I think?)
    for (i in arrOfSelectedStops){
        for (stop_num in arrOfSelectedStops[i]){
            let bus_stop = arrOfSelectedStops[i][stop_num];
            let lat = bus_stop["latitude"];
            let long = bus_stop["longitude"];
            arrOfCoords.push({"latitude": lat, "longitude": long});
        }
    }
    // console.log("BEFORE ARR OF COORDS - APP.JS");
    // console.log(arrOfCoords);
    // console.log("AFTER ARR OF COORDS - APP.JS");

    // Call the 'showJouneyOnMap' function in 'map.js' on the selected stops array to show the journey to the user
    $.getScript("static/js/map.js", function(){
        showJouneyOnMap(arrOfSelectedStops);
    }); 

    // Now I think I should return the Stop coords?
}

// ================================ SEARCH BY BUSSTOP ================================
// ********** On clicking "Search by Bus Stop" nav option, load JSON file (i.e. grab all the stops) **********
$("#search-by-stop-nav").click(function() {
    // Calls a synchronous AJAX function to return all stops and make them available to other functions (i.e. onkeyup function below)
    $.ajax({
        url: './static/map_bus_stop_to_routes_data.json',
        async: false,
        dataType: 'json',
        success: function (json) {
            national_stops = json;
        },
        error: function(error) { // An error most likely won't arise unless we mess with the JSON data or path
          console.log(`Error ${error}`);
        },
    });
});

// Grab the div that will store all the matches to the user's "Search by Bus Stop" request
const match_list = document.getElementById("match-list");

// ********** On keyup, show all relevant/matching stops that match what keystrokes are entered **********
$("#busstop-search").keyup(function (event) {
    // console.log(national_stops);
    console.log(event.target.value);
    // Grab the total value being entered into the text input each time a key is pressed (e.g. '1', '14', '145',) 
    let current_value = event.target.value;
    // Grab all the values of the bus stop JSON objects returned in the above AJAX call
    // N.B. - THIS IS CALLED EVERY TIME KEY IS CLICKED, WHICH IS PROBABLY A BAD IDEA
    let arr_of_stop_vals = Object.values(national_stops);
    // Logic to get matches to current text input value
    let matches = arr_of_stop_vals.filter(stop => {
        // g = global, i = case-insensitive
        const regex = new RegExp(`^${current_value}`, 'gi');
        return stop.searchname.match(regex);
    });
    // console.log(matches);

    // When search/input box is empty, we want there to be NO matches
    if (current_value.length === 0){
        matches = [];
        // Set the match-list div to an empty string
        match_list.innerHTML = '';
    }

    // Show all matches in a div below the input
    showMatches(matches);
});

// Show all the matching results in a dropdown option-like format   
const showMatches = matches => {
    // If there are matches to the current value of the text input
    if (matches.length > 0) {
        // Limit the number of matches shown to the user to 1st 10
        let num_of_results_shown = 10; 
        // Map each match of an array of match objects to an array of HTML string matches (converted to a single string with .join())
        const outputHTML = matches.slice(0, num_of_results_shown).map(match => `
            <div id="${match.searchname}" class="search-by-busstop-options" onclick="populateInputWithStop(this.id)">
                <p class="text-primary busstop-option" id="searchname-option">${match.searchname}</p>
                <small class="busstop-option" style="overflow-wrap:break-word; max-width:100%">${match.routes_through_stop}</small> 
            </div>
        `).join('');
        // <p> tag used to store the Searchname that the matching criteria is based off of.
        // <small> tag used to store the Routes serviced by a given matched Stop.

        // Set the match-list div to the first 10 matches
        match_list.innerHTML = outputHTML;

        // Message at bottom of dropdown list to show how many of all possible results showing (e.g. 10 out of 2000 matches showing)
        
        // If the number of matches found is over 10, show 1 message
        if (matches.length > 10) {
            match_list.innerHTML += 
                `<div class="total-matches-shown">
                    <h5>${num_of_results_shown} of possible ${matches.length} matches shown</h5>
                </div>`;
        // Else, message shows how many are being shown (all of the matches)
        } else {
            match_list.innerHTML += 
                `<div class="total-matches-shown">
                    <h5>All ${matches.length} matches are being shown</h5>
                </div>`;
        }
    }
}

// Autofill the bus stop input box upon clicking an option
function populateInputWithStop(clicked_busstop_searchname){
    console.log(clicked_busstop_searchname);
    let busstop_input = document.getElementById("busstop-search");
    busstop_input.value = clicked_busstop_searchname;
}

// ================================ MANAGING THE NAV-BAR TAB CLICKS AND DISPLAYS ================================
function navbarDisplay(evt, searchType) {
    var tabcontent = document.getElementsByClassName("tabcontent");
    for (var i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
    }
    var navLink = document.getElementsByClassName("nav-link");
    for (var i = 0; i < navLink.length; i++) {
        navLink[i].className = navLink[i].className.replace(" active", "");
    }
    document.getElementById(searchType).style.display = "block";
    evt.currentTarget.className += " active";

    // Hide the burger span (Not working fully, as when in full screen, clicking a nav option causes a click too.. Need to debug later) 
    $(".navbar-toggler").click();
}