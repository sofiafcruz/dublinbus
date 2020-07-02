// Implementing jQuery below;
$(document).ready(function(){ // START OF JQUERY BLOCK

    console.log("Connected");
    // Fetches local json object====================================
    fetch("static/data.json")
        .then((response) => response.json()) // Convert from Promise Pending object to JSON obj
        .then((data) => console.log(data)) // This gives us our data
        .catch((err) => console.log(err))// Catch errors, if they arise
        
        
    // Fetches create_json_response_obj view====================================
    // fetch("/create_json_response_obj")
    //     .then(function (response) {
    //         return response.json();
    //     })
    //     .then(function (myJson) {
    //         return myJson;
    //         console.log(myJson)
    //     })
    //     .catch(function (error) {
    //         console.log("Error: " + error);
    //     })
    
    
    

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

}); // END OF JQUERY BLOCK

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