// Implementing jQuery below;
$(document).ready(function(){ // START OF JQUERY BLOCK

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
    $("#search-elements-container").append("<div id='origin-and-dest-container'></div>"); 
    // Instead we want it to just render new origin and bus stop options every time new option clicked

    let origin_label = "<label for='origin'>Origin Stop:</label>";
    let origin_select = "<select name='origin-dropdown' id='origin-dropdown'></select>";
    let origin = "<div id='origin-portion>" + origin_label + origin_select + "</div>";

    let destination_label = "<label for='destination'>Destination Stop:</label>";
    let destination_select = "<select name='destination-dropdown' id='destination-dropdown'></select>"; 
    let destination = "<div id='destination-portion>" + destination_label + destination_select + "</div>";

    $("#origin-and-dest-container").append(origin);
    $("#origin-and-dest-container").append(destination);
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