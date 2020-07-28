// ================================ OTHER ================================
// ********** Save Journey for Logged in Users **********
// Attempt 1
// ********** On clicking "Save Journey", save the journey **********
// var save_journey_form = $("#save-journey-form");
// save_journey_form.submit(function () {
//   $.ajax({
//     type: save_journey_form.attr("method"), // POST
//     url: save_journey_form.attr("action"), // save_route_journey
//     data: save_journey_form.serialize(), // Get values of all the inputs
//     async: false,
//     success: function (data) {
//       console.log("All good");
//     },
//     error: function (error) {
//       console.log("Something went wrong!");
//       console.log(error);
//     },
//   });
// //   return false; // Stop the page from Reloading
// });
// Attempt 2
// $("#save-journey").click(function (e) {
//     // e.preventDefault();
//     // let selected_route = document.getElementById("json-routes").value;
//     // let selected_origin_stop = document.getElementById("json-starting-stops");
//     // var origin_opt = selected_origin_stop.options[selected_origin_stop.selectedIndex].text;
//     // let selected_destination_stop = document.getElementById("json-ending-stops");
//     // var destination_opt = selected_destination_stop.options[selected_destination_stop.selectedIndex].text;
//     // let stops_count = document.getElementById("json-ending-stops").value - document.getElementById("json-starting-stops").value + 1;
//     // // let distance = document.getElementById("json-ending-stops").value;

//     // console.log("Selected Journey Details;");
//     // console.log("=========================");
//     // console.log("Selected Route:", selected_route);
//     // console.log("Stop Count:", stops_count);
//     // console.log("Origin Stop:", origin_opt);
//     // console.log("Destination Stop:", destination_opt);

//     // document.getElementById("route-name-input").value = selected_route;
//     // document.getElementById("starting-stop-input").value = origin_opt;
//     // document.getElementById("ending-stop-input").value = destination_opt;
//     // document.getElementById("stop-count-input").value = parseInt(stops_count);

//     // console.log("HIDDEN FORM VALUES");
//     // console.log(document.getElementById("route-name-input").value);
//     // console.log(document.getElementById("starting-stop-input").value);
//     // console.log(document.getElementById("ending-stop-input").value);
//     // console.log(document.getElementById("stop-count-input").value);

    
//     //// Issues with CSRF below, as making a post request...
//     //// Not sure how to fix atm
//     // $.ajax({
//     //   url: "save_route_journey",
//     //   type: 'POST',
//     //   async: false,
//     //   data: {
//     //     "selected_route": selected_route,
//     //     "origin_opt": origin_opt,
//     //     "destination_opt": destination_opt,
//     //     "stops_count": stops_count
//     //   },
//     //   success: function (not_sure) {
//     //     console.log(not_sure);
//     //   },
//     //   error: function (error) {
//     //     // An error most likely won't arise unless we mess with the JSON data or path
//     //     console.log(`Error ${error}`);
//     //   },
//     // });
// });

// ********** On clicking "Show Balance" show User's Leap Card Balance (i.e. grab all the stops) **********
var leap_card_form = $("#leap-card-form");
leap_card_form.submit(function () {
  $.ajax({
    type: leap_card_form.attr("method"), // POST
    url: leap_card_form.attr("action"), // leap_card_info
    data: leap_card_form.serialize(), // Get values of both inputUsername and inputPassword
    async: false,
    success: function (data) {
      $("#balance-paragraph").text("Your Balance is: " + data);
    },
    error: function (error) {
      console.log("Something went wrong!");
      console.log(error);
      $("#balance-paragraph").innerHTML = "Something went wrong...";
    },
  });
  return false; // Stop the page from Reloading
});

// ================================ SEARCH BY ROUTE ================================

// ********** On clicking "Search by Bus Stop" nav option, load JSON file (i.e. grab all the stops) **********
$("#search-by-route-container").click(function () {
  console.log("check");
  // Calls a synchronous AJAX function to return all stops and make them available to other functions (i.e. onkeyup function below)
  $.ajax({
    // url: './static/map_bus_stop_to_routes_data.json',
    url: "./static/HD_routes_Frontend.json",
    async: false,
    dataType: "json",
    success: function (json) {
      hd_routes = json;
      // ********** Populate Route Dropdown **********
      var json_routes_dropdown = document.getElementById("json-routes");
      //   check for length of dropdown (intially 1 option) - to prevent list getting added to repeatedly
      if (json_routes_dropdown.length < 2) {
        // console.log(json_routes_dropdown.length);
        for (var key in hd_routes) {
          // for (var key in routes_frontend_object) {
          var opt = document.createElement("option");
          opt.value = key;
          opt.innerHTML = key;
          json_routes_dropdown.appendChild(opt);
        }
        console.log("down here");
      }
    },
    error: function (error) {
      // An error most likely won't arise unless we mess with the JSON data or path
      console.log(`Error ${error}`);
    },
  });
});

// ********** Route Dropdown **********
// $(document).ready(function(){
//     // On page load, populate the Route Dropdown in 'Search by Route' section
//     console.log("Before");
//     // console.log(routes_frontend_object);
//     console.log("After");
//     var json_routes_dropdown = document.getElementById("json-routes");
//     for (var key in main_table_object) {
//     // for (var key in routes_frontend_object) {
//         var opt = document.createElement('option');
//         opt.value = key;
//         opt.innerHTML = key;
//         json_routes_dropdown.appendChild(opt);
//     }
// });

// ********** Div containing Journey Info, Starting and Ending Stop Dropdowns  **********
// Display div containing filled drop down options of bus stops
// (Has to be outside of on-load ($(document).ready) to allow for on click event to call this function)
function showAndLoadStartAndEndDrops() {
  console.log("show_and_load fxn check");
  // Grab the route option selected
  var selected_route = document.getElementById("json-routes").value;
  // console.log(selected_route);
  // Target the starting and ending stops select dropdowns
  var json_starting_point_dropdown = document.getElementById(
    "json-starting-stops"
  );
  var json_ending_point_dropdown = document.getElementById("json-ending-stops");
  // Empty their contents EVERY call (or else values (stops) will be appended to them, rather than replacing them)
  $(json_starting_point_dropdown).empty();
  $(json_ending_point_dropdown).empty();
  // Need a nested for loop to grab the Address of each bus stop of the selected route
  // for (index in main_table_object[selected_route]){
  let direction_1 = hd_routes[selected_route].D1;
  // console.log(direction_1);
  // Grab the selected Route's Origin (From) and Destination (To) data
  let origin = direction_1["origin"];
  let destination = direction_1["destination"];
  // Set the header (From X to Y)
  $("#origin-to-destination-header").html(
    "From " + origin + " to " + destination
  );

  let stops = direction_1["stops"];
  for (index in stops) {
    // Grab the bus stop address
    let bus_stop_obj = stops[index];
    // console.log(bus_stop_obj);
    let stop_address = bus_stop_obj["search_name"];
    let stop_num = bus_stop_obj["stop_num"];
    // Store it into an option element
    var opt = document.createElement("option");
    opt.value = index; // Value is the index of the bus stop
    opt.innerHTML = stop_address + " (" + stop_num + ")";
    // Then clone it so it can also be appended to the Ending Stop dropdown
    var cloneOption = opt.cloneNode(true);
    // Append the current iteration's bus stop option to both starting and ending point dropdowns
    json_ending_point_dropdown.appendChild(opt);
    json_starting_point_dropdown.appendChild(cloneOption);
  }
  // At the end, make sure to display the container holding the starting and ending stop dropdowns (as it's initially hidden)
  $("#stops-dropdowns-container").css("display", "block");
}

// ********** Div containing Journey Info, Starting and Ending Stop Dropdowns  **********
// Display div containing filled drop down options of bus stops
// (Has to be outside of on-load ($(document).ready) to allow for on click event to call this function)
// function showAndLoadStartAndEndDrops() {
//     // Grab the route option selected
//     var selected_route = document.getElementById("json-routes").value;
//     console.log(selected_route);
//     // Grab the selected Route's Origin (From) and Destination (To) data
//     let origin = route_origin_and_destination_object[selected_route]["origin"];
//     let destination = route_origin_and_destination_object[selected_route]["destination"];
//     // Set the header (From X to Y)
//     $('#origin-to-destination-header').html("From " + origin + " to " + destination);
//     // Target the starting and ending stops select dropdowns
//     var json_starting_point_dropdown = document.getElementById("json-starting-stops");
//     var json_ending_point_dropdown = document.getElementById("json-ending-stops");
//     // Empty their contents EVERY call (or else values (stops) will be appended to them, rather than replacing them)
//     $(json_starting_point_dropdown).empty();
//     $(json_ending_point_dropdown).empty();
//     // Need a nested for loop to grab the Address of each bus stop of the selected route
//     for (index in main_table_object[selected_route]){
//         for (bus_stop in main_table_object[selected_route][index]){
//             // Grab the bus stop address
//             stop_address = main_table_object[selected_route][index][bus_stop]["stop_address"];
//             // Store it into an option element
//             var opt = document.createElement('option');
//             opt.value = index; // Value is the index of the bus stop
//             opt.innerHTML = stop_address + " (" + bus_stop + ")";
//             // Then clone it so it can also be appended to the Ending Stop dropdown
//             var cloneOption = opt.cloneNode(true);
//             // Append the current iteration's bus stop option to both starting and ending point dropdowns
//             json_ending_point_dropdown.appendChild(opt);
//             json_starting_point_dropdown.appendChild(cloneOption);
//         }
//     }
//     // At the end, make sure to display the container holding the starting and ending stop dropdowns (as it's initially hidden)
//     $('#stops-dropdowns-container').css('display', 'block');
// }

// ********** Logic to grab all the Stops between the selected Starting and Ending Stops INCLUSIVE  **********
// Initialising Empty Array of Coords (initialised outside so can also be used in 'map.js')
var arrOfCoords = [];

function generateStopArray() {
  // Function to grab all the stops between Starting and Ending Points of Journey
  // Grab all selected dropdown components
  var selected_route = document.getElementById("json-routes").value;
  var selected_start = parseInt(
    document.getElementById("json-starting-stops").value
  );
  var selected_end = parseInt(
    document.getElementById("json-ending-stops").value
  );
  // console.log(selected_route + " - " + selected_start + " - " + selected_end);

  // Grab all the stops from the selected route from Starting Stop to Ending Stop INCLUSIVE
  var arrOfSelectedStops = main_table_object[selected_route].slice(
    selected_start,
    selected_end + 1
  );
  // console.log(arrOfSelectedStops);

  // arrOfCoords reinitialised to empty array (Can't remember why??)
  arrOfCoords = [];

  // Iterate over the array of selected stops, grab their coordinates, and store them as Coord objects in arrOfCoords
  // (To be used in map.js for some reason I think?)
  for (i in arrOfSelectedStops) {
    for (stop_num in arrOfSelectedStops[i]) {
      let bus_stop = arrOfSelectedStops[i][stop_num];
      let lat = bus_stop["latitude"];
      let long = bus_stop["longitude"];
      arrOfCoords.push({ latitude: lat, longitude: long });
    }
  }
  // console.log("BEFORE ARR OF COORDS - APP.JS");
  // console.log(arrOfCoords);
  // console.log("AFTER ARR OF COORDS - APP.JS");

  // Call the 'showJourneyOnMap' function in 'map.js' on the selected stops array to show the journey to the user
  $.getScript("static/js/map.js", function () {
    showJourneyOnMap(arrOfSelectedStops);
  });
}

function showSaveJourneyBtn() {
  console.log("Show Save Journey Button");
    $("#save-journey").css("display", "block");
    // And fill in the form details etc... NOT WORKING THOUGH
    let selected_route = document.getElementById("json-routes").value;
    console.log("Selected Route:", selected_route);
    let selected_origin_stop = document.getElementById("json-starting-stops");
    console.log("Selected Origin Stop:", selected_origin_stop);
    var origin_opt = selected_origin_stop.options[selected_origin_stop.selectedIndex].text;
    let selected_destination_stop = document.getElementById("json-ending-stops");
    var destination_opt = selected_destination_stop.options[selected_destination_stop.selectedIndex].text;
    let stops_count = document.getElementById("json-ending-stops").value - document.getElementById("json-starting-stops").value + 1;
    // let distance = document.getElementById("json-ending-stops").value;

    console.log("Selected Journey Details;");
    console.log("=========================");
    console.log("Selected Route:", selected_route);
    console.log("Stop Count:", stops_count);
    console.log("Origin Stop:", origin_opt);
    console.log("Destination Stop:", destination_opt);

    document.getElementById("route-name-input").value = selected_route;
    document.getElementById("starting-stop-input").value = origin_opt;
    document.getElementById("ending-stop-input").value = destination_opt;
    document.getElementById("stop-count-input").value = parseInt(stops_count);

    console.log("HIDDEN FORM VALUES");
    console.log(document.getElementById("route-name-input").value);
    console.log(document.getElementById("starting-stop-input").value);
    console.log(document.getElementById("ending-stop-input").value);
    console.log(document.getElementById("stop-count-input").value);
}

// ********** DateTime Dropdown **********
// ***** DATE *****
// Create dates for today and next 4 days
var day1 = new Date(); // i.e. Today's date
var day2 = new Date();
day2.setDate(day1.getDate() + 1); // i.e. Tomorrow's date etc
var day3 = new Date();
day3.setDate(day2.getDate() + 1);
var day4 = new Date();
day4.setDate(day3.getDate() + 1);
var day5 = new Date();
day5.setDate(day4.getDate() + 1);

// Display dates in select options
document.getElementById("prediction-date-1").innerHTML =
  day1.toDateString() + " (Today)";
document.getElementById("prediction-date-2").innerHTML =
  day2.toDateString() + " (Tomorrow)";
document.getElementById("prediction-date-3").innerHTML = day3.toDateString();
document.getElementById("prediction-date-4").innerHTML = day4.toDateString();
document.getElementById("prediction-date-5").innerHTML = day5.toDateString();

// ***** TIME *****
var hour = day1.getHours();
var minutes = day1.getMinutes();
// Ensuring that each component (hours and minutes) has a leading zero if below 10 (e.g. "04:08")
hour = (hour < 10 ? "0" : "") + hour;
minutes = (minutes < 10 ? "0" : "") + minutes;

var currentTime = hour + ":" + minutes;
document.getElementById("choose-time").value = currentTime;

// ================================ SEARCH BY BUSSTOP ================================
// ********** On clicking "Search by Bus Stop" nav option, load STOPS JSON file (i.e. grab all the stops) **********
$("#bus-stop-search-container").click(function () {
  // Calls a synchronous AJAX function to return all stops and make them available to other functions (i.e. onkeyup function below)
  $.ajax({
    // url: './static/map_bus_stop_to_routes_data.json',
    url: "./static/HD_stops_Frontend.json",
    async: false,
    dataType: "json",
    success: function (json) {
      all_stops = json;
      // console.log(all_stops);
    },
    error: function (error) {
      // An error most likely won't arise unless we mess with the JSON data or path
      console.log(`Error ${error}`);
    },
  });
});
// ********** On clicking "Search by Bus Stop" nav option, load  ROUTES JSON file (i.e. grab all the routes) - NEEDED TO ITERATE OVER TO GRAB THEIR STOPS TO RENDER ON THE SCREEN! **********
$("#bus-stop-search-container").click(function () {
  // Calls a synchronous AJAX function to return all stops and make them available to other functions (i.e. onkeyup function below)
  $.ajax({
    // url: './static/map_bus_stop_to_routes_data.json',
    url: "./static/HD_routes_Frontend.json",
    async: false,
    dataType: "json",
    success: function (json) {
      all_routes = json;
      // console.log(all_stops);
    },
    error: function (error) {
      // An error most likely won't arise unless we mess with the JSON data or path
      console.log(`Error ${error}`);
    },
  });
});

// Grab the div that will store all the matches to the user's "Search by Bus Stop" request
const match_list = document.getElementById("match-list");

// ********** On keyup, show all relevant/matching stops that match what keystrokes are entered **********
$("#busstop-search").keyup(function (event) {
  // console.log(all_stops);
  console.log(event.target.value);
  // Grab the total value being entered into the text input each time a key is pressed (e.g. '1', '14', '145',)
  let current_value = event.target.value;
  // Grab all the values of the bus stop JSON objects returned in the above AJAX call
  // N.B. - THIS IS CALLED EVERY TIME KEY IS CLICKED, WHICH IS PROBABLY A BAD IDEA
  let arr_of_stop_vals = Object.values(all_stops);
  // console.log(arr_of_stop_vals);
  // Logic to get matches to current text input value
  let matches = arr_of_stop_vals.filter((stop) => {
    // g = global, i = case-insensitive
    const regex = new RegExp(`^${current_value}`, "gi");
    return stop.search_name.match(regex);
  });
  // console.log(matches);

  // When search/input box is empty, we want there to be NO matches
  if (current_value.length === 0) {
    matches = [];
    // Set the match-list div to an empty string
    match_list.innerHTML = "";
  }

  // Show all matches in a div below the input
  showMatches(matches);
});

// Show all the matching results in a dropdown option-like format
const showMatches = (matches) => {
  // If there are matches to the current value of the text input
  if (matches.length > 0) {
    // Limit the number of matches shown to the user to 1st 10
    let num_of_results_shown = 10;
    // Map each match of an array of match objects to an array of HTML string matches (converted to a single string with .join())
    const outputHTML = matches
      .slice(0, num_of_results_shown)
      .map(
        (match) => `
            <div id="${match.search_name}" class="search-by-busstop-options" onclick="populateInputWithStop(this.id)">
                <p class="text-primary busstop-option" id="searchname-option">${match.search_name}</p>
                <small class="busstop-option" style="overflow-wrap:break-word; max-width:100%">${match.routes_serviced}</small> 
            </div>
        `
      )
      .join("");
    // <p> tag used to store the Searchname that the matching criteria is based off of.
    // <small> tag used to store the Routes serviced by a given matched Stop.

    // Set the match-list div to the first 10 matches
    match_list.innerHTML = outputHTML;

    // Message at bottom of dropdown list to show how many of all possible results showing (e.g. 10 out of 2000 matches showing)

    // If the number of matches found is over 10, show 1 message
    if (matches.length > 10) {
      match_list.innerHTML += `<div class="total-matches-shown">
                                  <h5>${num_of_results_shown} of possible ${matches.length} matches shown</h5>
                              </div>`;
      // Else, message shows how many are being shown (all of the matches)
    } else {
      match_list.innerHTML += `<div class="total-matches-shown">
                                  <h5>All ${matches.length} matches are being shown</h5>
                              </div>`;
    }
  }
};

// Autofill the bus stop input box upon clicking an option
function populateInputWithStop(clicked_busstop_searchname) {
  console.log(clicked_busstop_searchname);
  let busstop_input = document.getElementById("busstop-search");
  busstop_input.value = clicked_busstop_searchname;
}

// ========== Favourites Popup Table Functionality ==========
$(".clickable-row").click(function() {
  console.log("Row in Favourites Table clicked!");

  let row_route_name = $(this).children()[2].textContent;
  let row_origin_stop = $(this).children()[3].textContent;
  let row_destination_stop = $(this).children()[4].textContent;

  console.log(row_route_name);
  console.log(row_origin_stop);
  console.log(row_destination_stop);

  // =====Changing Search by Route Options===== NOT WORKING!!!

  // 1. Close PopUp
  $('#close-favourites-popup').click();

  // 2. Click the "Search by Route" image tab; (FOR SOME REASON THEY'RE NOT WORKING!)
  $("#search-by-route-container").click(); // Needed to load the JSON file
  // $("#search-by-route-img").click();
  // $("#search-by-route-nav").click();
  

  // 3. Changing value of "Select Route";
  $('select#json-routes').val(row_route_name).change();

  // 4. Changing value of "Select Starting Point";
  $("select#json-starting-stops option").each(function(){     
    // console.log($(this).text());
    if($(this).text() == row_origin_stop){
        $(this).attr("selected","selected");    
    }
  });

  // 5. Changing value of "Select End Point";
  $("select#json-ending-stops option").each(function(){     
    // console.log($(this).text());
    if($(this).text() == row_destination_stop){
        $(this).attr("selected","selected");    
    }
  });

  // 6. Click "Show Journey"
  $('#show-journey').click();
  
  // OTHER OPTIONS TO CONSIDER:
  // - The Value of the journey? (to determine the number of stops?)
  // - Set Adult/Child/Student
  // - Set Payment Mode (for fare calculator)
  
  // Trying to access all the TD elements in the clicked row;
  // ()
  // Option 1
  // console.log("Iteration: Option 1")
  // $(this).find('td').each (function(index, td) {
  //   console.log(index, td.textContent);
  //   // ROW FORMAT
  //   // ==========
  //   // 0. #
  //   // 1. PK
  //   // 2. Route Name/Num
  //   // 3. Start
  //   // 4. End
  //   // 5. # Stops
  //   // 6. Date Saved
  //   // 7. Summary
  //   // 8. Delete
  // });

  // Option 2
  // $.each(this.cells, function(){
  //   console.log('Option 2');
  // });
});

// Delete a Row (from the DOM (rather than from the database))
function deleteRow(ele) {
  console.log("DELETE THIS ROW!");
  console.log("=====Start=====");
  console.log(ele);
  let td_ele = ele.parentNode;
  console.log(td_ele);
  let tr_ele = td_ele.parentNode;
  console.log(tr_ele);
  console.log("=====End=====");
}

// Prevent clicking Delete Icon from showing the journey!
$('.delete-row-td').click(function(event) {
  event.stopPropagation();
});