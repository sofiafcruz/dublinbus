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

// ================================ SEARCH BY BUSSTOP ==============================================
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

// ********** On keyup, show all relevant/matching stops that match what keystrokes are entered **********
$("#busstop-search").keyup(function (event) {
    // console.log(national_stops);
    console.log(event.target.value);
    // Grab the total value being entered into the text input each time a key is pressed (e.g. '1', '14', '145',) 
    let current_value = event.target.value;
    // Grab all the values of the bus stop JSON objects returned in the above AJAX call
    // N.B. - THIS IS CALLED EVERY TIME KEY IS CLICKED, WHICH IS PROBABLY A BAD IDEA
    let arr_of_stop_vals = Object.values(national_stops);
    // Get matches to current text input
    let matches = arr_of_stop_vals.filter(stop => {
        // g = global, i = case-insensitive
        const regex = new RegExp(`^${current_value}`, 'gi');
        // console.log(stop);
        return stop.searchname.match(regex);
    });
    // SHOW ALL MACTHES
    // console.log(matches);

    // When search/input box is empty, we want there to be NO matches
    if (current_value.length === 0){
        matches = [];
        match_list.innerHTML = '';
    }

    showMatches(matches);
});

// Show all matches in html
const showMatches = matches => {
    if (matches.length > 0) {
        // Array of HTML string matches (converted to a single string)
        let num_of_results_shown = 10; // To limit the number of matches shown to the user to 1st 10
        const outputHTML = matches.slice(0, num_of_results_shown).map(match => `
            <div id="${match.searchname}" class="search-by-busstop-options" onclick="populateInputWithStop(this.id)">
                <p class="text-primary busstop-option" id="searchname-option">${match.searchname}</p>
                <small class="busstop-option" style="overflow-wrap:break-word; max-width:100%">${match.routes_through_stop}</small>
            </div>
        `).join('');
        match_list.innerHTML = outputHTML;

        // Message at bottom of dropdown list to show how many of all possible results showing

        // If the number of matches found is over 10, show 1 message
        if (matches.length > 10) {
            match_list.innerHTML += 
                `<div class="total-matches-shown">
                    <h5>${num_of_results_shown} of possible ${matches.length} matches shown</h5>
                </div>`;
        // Else, show a different message
        } else {
            match_list.innerHTML += 
                `<div class="total-matches-shown">
                    <h5>All ${matches.length} matches are being shown</h5>
                </div>`;
        }
    }
}

const match_list = document.getElementById("match-list");

// Autofill the bus stop input box upon clicking an option
function populateInputWithStop(clicked_busstop_searchname){
    console.log(clicked_busstop_searchname);
    let busstop_input = document.getElementById("busstop-search");
    busstop_input.value = clicked_busstop_searchname;
}
//==================================================================================


var callum_all_routes = ['68', '25B', '45A', '25A', '14', '77A', '39', '16', '40D', '27B',
    '142', '83', '130', '15', '46A', '33', '7', '39A', '49', '1',
   '123', '41', '67X', '59', '9', '40', '239', '76', '84', '53',
    '185', '151', '13', '15B', '65B', '29A', '61', '140', '79A', '38A',
   '31', '33B', '69', '44', '42', '67', '184', '238', '145', '17A',
    '32', '27A', '17', '27X', '18', '122', '54A', '66', '150', '56A',
   '37', '27', '15A', '65', '11', '47', '79', '83A', '63', '4', '120',
    '41C', '70', '84A', '220', '39X', '32X', '68A', '84X', '38', '102',
   '270', '51X', '33X', '75', '26', '66A', '31A', '111', '14C', '114',
    '76A', '44B', '161', '7A', '43', '25', '104', '33A', '16C', '42D',
   '31B', '66X', '31D', '33D', '41B', '40B', '7D', '46E', '38D',
    '118', '51D', '15D', '41A', '25D', '66B', '38B', '236', '7B',
    '41X', '69X', '68X', '25X', '40E', '70D', '116', '77X', '16D',
   '33E', '41D'];

callum_all_routes.sort()

// Dynamically fill dropdown options with sorted elements
$('#initial-dropdown').empty();
$.each(callum_all_routes, function(i, p) {
    $('#initial-dropdown').append($('<option></option>').val(p).html(p));
});

// Handling when an option is clicked (Doesn't work if you click number 1)
// Also it will keep appendning elements every time option is clicked!!!!!!!!!!!!!!!!!!
$('#initial-dropdown').change(function(){ 
    var value = $(this).val();
    console.log(value);
    // QUERY DATABASE ROUTES TABLE FOR THIS ROUTE NUMBER
    // GRAB THE CORRESPONDING INFO:
    // - JOURNEY SUMMARY (i.e. from Sutton Station to Dublin Airport)
    // - ORIGIN
    // - DESTINATION
    // 

    // Problem - This appends EVERYTIME (instead should just do it once)
    $("#search-elements-container").append("<div id='start-and-end-container'></div>"); 
    // Instead we want it to just render new origin and bus stop options every time new option clicked

    let start_stop_label = "<label for='start'>Starting Stop:</label>";
    let start_stop_select = "<select name='start-dropdown' id='start-dropdown'></select>";
    let start_stop = "<div id='start-portion>" + start_stop_label + start_stop_select + "</div>";

    let end_stop_label = "<label for='end'>Ending Stop:</label>";
    let end_stop_select = "<select name='end-dropdown' id='end-dropdown'></select>"; 
    let end_stop = "<div id='end-portion>" + end_stop_label + end_stop_select + "</div>";

    $("#start-and-end-container").append(start_stop);
    $("#start-and-end-container").append(end_stop);
});



// TEST CODE BELOW=========================================================================
// console.log("Hello");
// if (5 > 3){
//     console.log("Test passed!");
//     let message = "JS is Connected!";
//     document.getElementById("test-js-connection").innerHTML = message;
// }

// var form = document.getElementById("form-id");

// document.getElementById("submit-id").addEventListener("click", showInputs); 

// function showInputs () {

//     let originLabel = document.createElement("label");
//     let originInput = document.createElement("input");

//     originLabel.innerHTML = "Starting Point: ";
//     form.appendChild(originLabel);

//     originInput.type = "text";
//     originInput.className = "origin-input"; // set the CSS class
//     form.appendChild(originInput); // put it into the DOM
    
//     let destinationLabel = document.createElement("label");
//     let destinationInput = document.createElement("input");
    
//     destinationLabel.innerHTML = "End Point: ";
//     form.appendChild(destinationLabel);

//     destinationInput.type = "text";
//     destinationInput.className = "destination-input"; // set the CSS class
//     form.appendChild(destinationInput); // put it into the DOM

//     document.getElementById("submit-id").removeEventListener('click', showInputs);
// };


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