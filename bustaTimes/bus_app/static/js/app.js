console.log("Hello");
if (5 > 3){
    console.log("Test passed!");
    let message = "JS is Connected!";
    document.getElementById("test-js-connection").innerHTML = message;
}

var form = document.getElementById("form-id");

document.getElementById("submit-id").addEventListener("click", showInputs); 

function showInputs () {

    let originLabel = document.createElement("label");
    let originInput = document.createElement("input");

    originLabel.innerHTML = "Starting Point: ";
    form.appendChild(originLabel);

    originInput.type = "text";
    originInput.className = "origin-input"; // set the CSS class
    form.appendChild(originInput); // put it into the DOM
    
    let destinationLabel = document.createElement("label");
    let destinationInput = document.createElement("input");
    
    destinationLabel.innerHTML = "End Point: ";
    form.appendChild(destinationLabel);

    destinationInput.type = "text";
    destinationInput.className = "destination-input"; // set the CSS class
    form.appendChild(destinationInput); // put it into the DOM

    document.getElementById("submit-id").removeEventListener('click', showInputs);
};