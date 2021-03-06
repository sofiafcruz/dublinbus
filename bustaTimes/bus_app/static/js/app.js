// Global Vars;
var current_direction;

// ********** On clicking "Show Balance" show User's Leap Card Balance (i.e. grab all the stops) **********
var leap_card_form = $("#leap-card-form");
leap_card_form.submit(function () {
  // Show the loading icon
  $.ajax({
    type: leap_card_form.attr("method"), // POST
    url: leap_card_form.attr("action"), // leap_card_info
    data: leap_card_form.serialize(), // Get values of both inputUsername and inputPassword
    async: true, // NNEDS TO BE TRUE FOR SOME REASON
    beforeSend: function () {
      $(".ajax-loading").show();
      $("#balance-paragraph").hide();
    },
    success: function (data) {
      $(".ajax-loading").hide();
      $("#balance-paragraph").show();
      $("#balance-paragraph").text("Your Balance is: €" + data.toFixed(2));
    },
    error: function (error) {
      // console.log("Something went wrong! problem with user credentials or the API");
      console.log(error);
      $(".ajax-loading").hide();
      $("#balance-paragraph").show();
      $("#balance-paragraph").text("Something went wrong...");
    },
  });
  return false; // Stop the page from Reloading
});

// ================================ SEARCH BY ROUTE ================================

// ********** On clicking "Search by Bus Stop" nav option, load JSON file (i.e. grab all the stops) **********
$("#search-by-route-container").click(function () {
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
        for (var key in hd_routes) {
          var opt = document.createElement("option");
          opt.value = key;
          opt.innerHTML = key;
          json_routes_dropdown.appendChild(opt);
        }
      }
    },
    error: function (error) {
      // An error most likely won't arise unless we mess with the JSON data or path
      console.log(`Error ${error}`);
    },
  });
});

// ======================GEt prediction and display to frontend i.e. handling prediction from model query==========================
var prediction_form = $("#route_prediction_form");
prediction_form.submit(function () {
  // Show the loading icon
  $.ajax({
    type: prediction_form.attr("method"), // POST
    url: prediction_form.attr("action"), // leap_card_info
    data: prediction_form.serialize(), // Get values of both inputUsername and inputPassword
    async: true,
    success: function (data) {
      console.log("data: ", data);

      // add some logic for error message
      document.getElementById("display_prediction").innerHTML =
        "Approximate Journey Prediction: *" + data;
    },
    error: function (error) {
      $("#balance-paragraph").innerHTML = "Something went wrong...";
    },
  });
  return false; // Stop the page from Reloading
});

// ********** Div containing Journey Info, Starting and Ending Stop Dropdowns  **********
// Display div containing filled drop down options of bus stops
// (Has to be outside of on-load ($(document).ready) to allow for on click event to call this function)
function showAndLoadStartAndEndDrops(direction) {
  // Given the current direction load the dropdown divs with teh appropriate bus stop options
  current_direction = direction;

  // Grab the route option selected
  var selected_route = document.getElementById("json-routes").value;

  // Target the starting and ending stops select dropdowns
  var json_starting_point_dropdown = document.getElementById(
    "json-starting-stops"
  );
  var json_ending_point_dropdown = document.getElementById("json-ending-stops");

  // Empty their contents EVERY call (or else values (stops) will be appended to them, rather than replacing them)
  $(json_starting_point_dropdown).empty();
  $(json_ending_point_dropdown).empty();
  // Need a nested for loop to grab the Address of each bus stop of the selected route

  let direction_1 = hd_routes[selected_route][direction];

  // Save in all route stops into full route array (array of 'stop' objects) - pass to map.js to be mapped
  let full_route = hd_routes[selected_route][current_direction]["stops"];
  $.getScript("static/js/map.js", function () {
    showJourney(full_route);
  });

  // Grab the selected Route's Origin (From) and Destination (To) data
  let origin = direction_1["origin"];
  let destination = direction_1["destination"];
  // Set the header (From X to Y)
  $("#origin-to-destination-header").html(
    "From " + origin + " to " + destination
  );

  // Populating drop downs - separate into function so that it can be altered and dynamic - first drop down will always have all stops - only second one needs to be filtered
  // originally populate a certain way (default start, then have a function which alters the second drop down)

  let stops = direction_1["stops"];
  for (index in stops) {
    // Grab the bus stop address
    let bus_stop_obj = stops[index];
    let stop_address = bus_stop_obj["search_name"];
    let stop_num = bus_stop_obj["stop_num"];
    // Store it into an option element
    var opt = document.createElement("option");
    opt.value = index; // Value is the index of the bus stop
    opt.innerHTML = stop_address;

    // last index - don;t want it to be in start dropdown
    if (index == stops.length - 1) {
      json_ending_point_dropdown.appendChild(opt);
    } else {
      // Then clone it so it can also be appended to the Ending Stop dropdown
      var cloneOption = opt.cloneNode(true);
      // Append the current iteration's bus stop option to both starting and ending point dropdowns
      json_starting_point_dropdown.appendChild(opt);
    }

    // skip first index - can only select first two stops
    if (index > 0 && index != stops.length - 1) {
      json_ending_point_dropdown.appendChild(cloneOption);
    }
    if (index == stops.length - 1) {
      json_ending_point_dropdown.options[stops.length - 2].selected = true;
    }
  }
  // At the end, make sure to display the container holding the starting and ending stop dropdowns (as it's initially hidden)
  $("#stops-dropdowns-container").css("display", "block");
}

// ********** Logic to grab all the Stops between the selected Starting and Ending Stops INCLUSIVE  **********
// Initialising Empty Array of Coords (initialised outside so can also be used in 'map.js')
// var arrOfCoords = [];

function generateStopArray() {
  // Function to grab all the stops between Starting and Ending Points of Journey - executed when 'show journey' button is clicked
  // Grab all selected dropdown components
  var selected_route = document.getElementById("json-routes").value;
  var selected_start = parseInt(
    document.getElementById("json-starting-stops").value
  );
  var selected_end = parseInt(
    document.getElementById("json-ending-stops").value
  );

  // Logic for if Destination before Origin or vice versa
  if (selected_start > selected_end) {
    alert("Warning: Cannot have Start Stop AFTER Destination Stop");
    return;
  }

  // Grab all the stops from the selected route from Starting Stop to Ending Stop INCLUSIVE - uses global variable 'current_direction' as default
  var arrOfSelectedStops = hd_routes[selected_route][current_direction][
    "stops"
  ].slice(selected_start, selected_end + 1);

  var arrOfCoords = [];

  for (i in arrOfSelectedStops) {
    let lat = arrOfSelectedStops[i]["lat"];
    let long = arrOfSelectedStops[i]["long"];
    arrOfCoords.push({ latitude: lat, longitude: long });
  }

  // Call the 'showJourneyOnMap' function in 'map.js' on the selected stops array to show the journey to the user
  $.getScript("static/js/map.js", function () {
    showJourneyOnMap(arrOfSelectedStops, arrOfCoords);
  });
}

function showSaveJourneyBtn() {
  // Show the "Save Journey" option for the user and extract the values for the journey of interest
  $("#save-journey").css("display", "block");

  let selected_route = document.getElementById("json-routes").value;
  let selected_origin_stop = document.getElementById("json-starting-stops");
  var origin_opt =
    selected_origin_stop.options[selected_origin_stop.selectedIndex].text;
  let selected_destination_stop = document.getElementById("json-ending-stops");
  var destination_opt =
    selected_destination_stop.options[selected_destination_stop.selectedIndex]
      .text;
  let stops_count =
    document.getElementById("json-ending-stops").value -
    document.getElementById("json-starting-stops").value;

  document.getElementById("route-name-input").value = selected_route;
  document.getElementById("starting-stop-input").value = origin_opt;
  document.getElementById("ending-stop-input").value = destination_opt;
  document.getElementById("stop-count-input").value = parseInt(stops_count);
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
    url: "./static/HD_stops_Frontend.json",
    async: false,
    dataType: "json",
    success: function (json) {
      all_stops = json;
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
    url: "./static/HD_routes_Frontend.json",
    async: false,
    dataType: "json",
    success: function (json) {
      all_routes = json;
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
  console.log(event.target.value);
  // Grab the total value being entered into the text input each time a key is pressed (e.g. '1', '14', '145',)
  let current_value = event.target.value;
  // Grab all the values of the bus stop JSON objects returned in the above AJAX call
  let arr_of_stop_vals = Object.values(all_stops);
  // Logic to get matches to current text input value
  let matches = arr_of_stop_vals.filter((stop) => {
    // g = global, i = case-insensitive
    const regex = new RegExp(`^${current_value}`, "gi");
    return stop.search_name.match(regex);
  });

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
                <small class="busstop-option text-muted" style="overflow-wrap:break-word; max-width:100%">${match.routes_serviced}</small> 
            </div>
            <hr style="margin:5px;">
        `
      )
      .join("");

    // Set the match-list div to the first 10 matches
    match_list.innerHTML = outputHTML;

    // Message at bottom of dropdown list to show how many of all possible results showing (e.g. 10 out of 2000 matches showing)

    // If the number of matches found is over 10, show 1 message
    if (matches.length > 10) {
      match_list.innerHTML += `<div class="total-matches-shown">
                                  <small>${num_of_results_shown} of ${matches.length} matches shown</small>
                              </div>`;
      // Else, message shows how many are being shown (all of the matches)
    } else {
      match_list.innerHTML += `<div class="total-matches-shown">
                                  <small>All ${matches.length} matches are being shown</small>
                              </div>`;
    }
  }
};

// Autofill the bus stop input box upon clicking an option
function populateInputWithStop(clicked_busstop_searchname) {
  let busstop_input = document.getElementById("busstop-search");
  busstop_input.value = clicked_busstop_searchname;

  // Hide matches list
  match_list.innerHTML = "";
  document.getElementById("routes-serviced-legend").innerHTML = "";
}

// ========== Favourites Popup Table Functionality ==========
$(".clickable-row").click(function () {
  let row_route_name = $(this).children()[0].textContent;
  let row_origin_stop = $(this).children()[1].textContent;
  let row_destination_stop = $(this).children()[2].textContent;

  // =====Changing Search by Route Options=====

  // 1. Close PopUp
  $("#close-favourites-popup").click();

  var element = document.getElementById("search-by-route-img");
  var event = new Event("clickEvent");
  element.dispatchEvent(event);

  // 2. Click the "Search by Route" image tab; (FOR SOME REASON THEY'RE NOT WORKING!)
  $("#search-by-route-container").click(); // Needed to load the JSON file
  // Required to target the right button to click
  let route_button_target = `
  <div class="menu-container tablinks" id="search-by-route-img" onclick="openTab(event, 'search-by-route-container'); clearLingeringRenderedObjects(); panToUsersLocation(); showMarkers();">
    <img src="./static/images/menu/by-route.svg" alt="Search by route" class="image">
    <div class="overlay">
      <div class="menu-text">Route</div>
    </div>
  </div>
  `;

  var someEvt = new MouseEvent("click");
  openTab(someEvt, "search-by-route-container", route_button_target);

  // 3. Changing value of "Select Route";
  $("select#json-routes").val(row_route_name).change();

  // 4. Changing value of "Select Starting Point";
  $("select#json-starting-stops option").each(function () {
    if ($(this).text() == row_origin_stop) {
      $(this).attr("selected", "selected");
    }
  });

  // 5. Changing value of "Select End Point";
  $("select#json-ending-stops option").each(function () {
    if ($(this).text() == row_destination_stop) {
      $(this).attr("selected", "selected");
    }
  });

  // 6. Click "Show Prediction"
  $("#show-prediction").click();
});

// Delete a Row (from the DOM (rather than from the database))
function deleteRow(ele) {
  // NO FUNCTIONALITY YET AS ATM PAGE RELOADS (will get incorporated in future)

  let td_ele = ele.parentNode;
  let tr_ele = td_ele.parentNode;
}

// Prevent clicking Delete Icon from showing the journey!
$(".delete-row-td").click(function (event) {
  event.stopPropagation();
});

// ==================== Calculate Fare ====================
function calculateFare() {
  let time = document.getElementById("choose-time").value;
  let day = document.getElementById("date-selector").value.split(" ")[0];
  let x_route;
  let route = document.getElementById("json-routes").value;
  // Determine if user is looking for a standard route or Xpresso
  if (route.charAt(route.length - 1) === "X") {
    x_route = true;
  } else {
    x_route = false;
  }

  $.getJSON("./static/fares.json", function (data) {

    // Declare variables used to generate fare table data
    let selected_customer;
    let leap_card_prices;
    let cash_prices;
    let leap_card_fare;
    let cash_fare;
    let result;

    // ===== Adult Data =====
    // If Xpresso route, set the fares
    if (x_route) {
      cash_fare = 3.8;
      leap_card_fare = 3;
      // Else perform logic to determine the fares
    } else {
      selected_customer = data["adult"];
      // Grab Payment Types
      leap_card_prices = selected_customer["leap_card"];
      cash_prices = selected_customer["cash"];

      // Determine Fare LOGIC

      let leap_card_stages = leap_card_prices["stages"];
      let cash_stages = cash_prices["stages"];

      let stops_count =
        document.getElementById("json-ending-stops").value -
        document.getElementById("json-starting-stops").value;

      // if short journey
      if (stops_count <= 3) {
        leap_card_fare = leap_card_stages[0]["short"];
        cash_fare = cash_stages[0]["short"];
        // elif medium journey
      } else if (stops_count <= 13) {
        leap_card_fare = leap_card_stages[1]["medium"];
        cash_fare = cash_stages[1]["medium"];
        // else long journey
      } else {
        leap_card_fare = leap_card_stages[2]["long"];
        cash_fare = cash_stages[2]["long"];
      }
    }

    // Result (row of data in table)
    result = `
              <table class="table table-sm table-hover">
                <thead class="thead-light">
                  <tr>
                    <th><small>Type</small></th>
                    <th><small>Cash(€)</small></th>
                    <th><small>Leap Card(€)</small></th>
                  </tr>
                </thead>
                <tr>
                  <td><small class="text-muted">Adult</small></td>
                  <td><small class="text-muted">${cash_fare.toFixed(
                    2
                  )}</small></td>
                  <td><small class="text-muted">${leap_card_fare.toFixed(
                    2
                  )}</small></td>
                </tr>
            `;

    // ===== Child Data =====
    // If Xpresso route, set the fares
    if (x_route) {
      cash_fare = 1.6;
      leap_card_fare = 1.26;
      // Else perform logic to determine the fares
    } else {
      selected_customer = data["child"];

      // Grab Payment Types
      leap_card_prices = selected_customer["leap_card"];
      cash_prices = selected_customer["cash"];

      // Determine Fare LOGIC

      let weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri"];

      let leap_card_day_type;
      let cash_day_type;

      // if day is a weekday
      if (weekdays.includes(day)) {
        leap_card_day_type = leap_card_prices["weekday"];
        cash_day_type = cash_prices["weekday"];

        // Check time of day selected
        if (time < "19:00") {
          cash_fare = cash_day_type[0]["school"];
          leap_card_fare = leap_card_day_type[0]["school"];
        } else {
          cash_fare = cash_day_type[1]["outside_school"];
          leap_card_fare = leap_card_day_type[1]["outside_school"];
        }

        // else if day is a saturday
      } else if (day === "Sat") {
        leap_card_day_type = leap_card_prices["saturday"];
        cash_day_type = cash_prices["saturday"];

        if (time < "13:30") {
          cash_fare = cash_day_type[0]["school"];
          leap_card_fare = leap_card_day_type[0]["school"];
        } else {
          cash_fare = cash_day_type[1]["outside_school"];
          leap_card_fare = leap_card_day_type[1]["outside_school"];
        }
        // else it's sunday
      } else {
        leap_card_fare = leap_card_prices["sunday"];
        cash_fare = cash_prices["sunday"];
      }
    }

    // Result (row of data in table)
    result += `
                <tr>
                  <td><small class="text-muted">Child</small></td>
                  <td><small class="text-muted">${cash_fare.toFixed(
                    2
                  )}</small></td>
                  <td><small class="text-muted">${leap_card_fare.toFixed(
                    2
                  )}</small></td>
                </tr>
              </table>
            `;

    document.getElementById("fare-table").innerHTML = result;
  });
}

// ====================== Toggle Hide the Menu ======================
$("#toggle-hide-menu").click(function () {
  let menu = document.getElementById("search-menu-container");
  var menu_width = menu.offsetWidth + 20;

  if ($("#search-menu-container").hasClass("move-left")) {
    $("#search-menu-container").removeClass("move-left");
    $("#search-menu-container").addClass("move-right");
    // Move the container "right" (to its original position)
    $("#search-menu-container").css({
      "-webkit-transform": "translate(0px,0px)",
    });
  } else {
    $("#search-menu-container").addClass("move-left");
    $("#search-menu-container").removeClass("move-right");
    // Move the container "left" based on the width of the menu! (makes it dynamic)
    $("#search-menu-container").css({
      "-webkit-transform": `translate(-${menu_width}px,0px)`,
    });
  }
});

// ================ Change Direction Functionality ================
$("#change-direction").click(function (e) {
  e.preventDefault();
  // current_direction is a global variable that gets updated every time a user clicks the switch button
  if (current_direction === "D1") {
    current_direction = "D2";
    // set direction of hidden div (inside form - needed to pass direction to backend) to 2
    document.getElementById("hidden_directon").value = "2";
  } else {
    document.getElementById("hidden_directon").value = "1";
  }
  // Load route drop down with current direction
  showAndLoadStartAndEndDrops(current_direction);
});
