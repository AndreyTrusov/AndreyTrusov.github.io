let stepMode = false;
let nextStepReady = false;

let currentSpeed = 1;
let setSpeedMode = true;

const speed1xButton = document.getElementById("speed1xButton");
const speed05xButton = document.getElementById("speed05xButton");
const fullSpeedButton = document.getElementById("fullSpeedButton");

// Add event listeners to the buttons
speed1xButton.addEventListener("click", () => {
    setSpeed(1);
    updateButtonClasses(speed1xButton);
});

speed05xButton.addEventListener("click", () => {
    setSpeed(2);
    updateButtonClasses(speed05xButton);
});

fullSpeedButton.addEventListener("click", () => {
    setSpeed(0.1);
    changeSpeedMode();
    updateButtonClasses(fullSpeedButton);
});

// Function to update button classes
function updateButtonClasses(clickedButton) {
    // Reset all buttons to btn-primary
    speed1xButton.classList.remove("btn-info");
    speed1xButton.classList.add("btn-primary");

    speed05xButton.classList.remove("btn-info");
    speed05xButton.classList.add("btn-primary");

    fullSpeedButton.classList.remove("btn-info");
    fullSpeedButton.classList.add("btn-primary");

    // Change the clicked button to btn-info
    clickedButton.classList.remove("btn-primary");
    clickedButton.classList.add("btn-info");
}


document.getElementById("stepModeButton").addEventListener("click", () => setStepMode());
document.getElementById("nextStepButton").addEventListener("click", () => {
    nextStepReady = true;
});

function setSpeed(multiplier) {
    currentSpeed = multiplier;
    logMessage(`Speed changed`);
}

function changeSpeedMode() {
    setSpeedMode = !setSpeedMode;
}

function setStepMode() {
    stepMode = !stepMode;

    const setModeButton = document.getElementById("stepModeButton");
    const nextStepButton = document.getElementById("nextStepButton");

    if (stepMode) {
        setModeButton.textContent = "Step mode ON";
        setModeButton.style.backgroundColor = "green";
        nextStepButton.disabled = false;
    } else {
        setModeButton.textContent = "Step mode OFF";
        setModeButton.style.backgroundColor = "grey";
        nextStepButton.disabled = true;
    }
}