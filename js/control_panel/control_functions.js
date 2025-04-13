let contextMenu;

// document.getElementById("changeModeButton").addEventListener("click", toggleChangingMode);
document.getElementById("toggleButton").addEventListener("click", toggleMapInteractivity);
document.getElementById("toggleBFSButton").addEventListener("click", toggleBfs);
document.getElementById("refreshAlgorithmButton").addEventListener("click", refreshAlgorithmButton);

// Map Interactivity
function toggleMapInteractivity() {
    const isDraggable = map.get("draggable");
    const toggleButton = document.getElementById("toggleButton");

    map.setOptions({draggable: !isDraggable});

    // Update the button text based on the new draggable state
    if (isDraggable) {
        toggleButton.textContent = "Make Map Dynamic";
    } else {
        toggleButton.textContent = "Make Map Static";
    }
}

// Refresh algorithm
function refreshAlgorithmButton() {
    // Clear markers
    if (endMarker) {
        endMarker.setMap(null);
        endMarker = null;
    }

    if (startMarker) {
        startMarker.setMap(null);
        startMarker = null;
    }

    markers.forEach(marker => {
        marker.setMap(null);
    });
    markers.length = 0;

    // Remove all lines
    lines.forEach(line => {
        line.setMap(null);
    });
    lines.length = 0;

    // Clear data structures
    map_2.clear();

    // Reset algorithm state
    bfsRunning = false;
    nextStepReady = false;
    visited = new Set();
    parentMap = new Map();
    queue = [];
    path = [];

    // Reset modes
    stepMode = false;
    setSpeedMode = false;
    currentSpeed = 1;

    updateStartButtonText();
    clearLogMessages();

    logMessage("Algorithm refreshed completely");
}

// If no start/finish point set --> start button is not available
const toggleBFSButton = document.getElementById("toggleBFSButton");

function updateStartButtonText() {
    if (!startMarker || !endMarker || !startMarker.getPosition() || !endMarker.getPosition()) {
        toggleBFSButton.disabled = true;
        toggleBFSButton.textContent = "Set positions to unlock";
    } else {
        toggleBFSButton.disabled = false;
        toggleBFSButton.textContent = "Start BFS Pathfinding";
    }
}

let bfsRunning = false;

async function toggleBfs() {
    bfsRunning = !bfsRunning;
    const button = document.getElementById("toggleBFSButton");

    if (bfsRunning) {
        button.textContent = "Stop BFS Pathfinding";
        button.classList.remove("btn-success");
        button.classList.add("btn-danger");

        logMessage("Starting BFS Pathfinding");
        await startBfs();
    } else {
        // Stop BFS
        button.textContent = "Start BFS Pathfinding";
        button.classList.remove("btn-danger");
        button.classList.add("btn-success");

        logMessage("BFS Pathfinding Stopped");
    }
}

async function startBfs() {
    bfsRunning = true;
    await bfsPathfinding({lat: startMarker.getPosition().lat(), lng: startMarker.getPosition().lng()},
        {lat: endMarker.getPosition().lat(), lng: endMarker.getPosition().lng()});
    // await aStarPathfinding({lat: startMarker.getPosition().lat(), lng: startMarker.getPosition().lng()},
    //     {lat: endMarker.getPosition().lat(), lng: endMarker.getPosition().lng()});
}

async function waitUntilRunning() {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (stepMode) {
                if (nextStepReady && bfsRunning) {
                    clearInterval(interval);
                    nextStepReady = false;
                    resolve();
                }
            } else {
                if (bfsRunning) {
                    clearInterval(interval);
                    resolve();
                }
            }
        }, 100);
    });
}

document.addEventListener('DOMContentLoaded', function () {
    const algorithmButtons = document.querySelectorAll('.algorithm-selector .btn');

    algorithmButtons.forEach(button => {
        button.addEventListener('click', function () {
            // Remove active class from all buttons
            algorithmButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            this.classList.add('active');

            // Get algorithm type from button ID
            const algorithm = this.id;
            console.log(`Switched to ${algorithm}`);

            // Navigate to the corresponding HTML file based on algorithm
            if (algorithm === 'mapButton') {
                window.location.href = 'index_old.html';
            } else if (algorithm === 'bfsButton') {
                window.location.href = 'index.html';
            } else if (algorithm === 'dijkstraButton') {
                window.location.href = 'index_3.html';
            } else if (algorithm === 'dfsButton') {
                window.location.href = 'index_4.html';
            } else if (algorithm === 'astarButton') {
                window.location.href = 'index_5.html';
            } else if (algorithm === 'bidirectionalButton') {
                window.location.href = 'index_6.html';
            } else if (algorithm === 'randomWalkButton') {
                window.location.href = 'index_7.html';
            } else if (algorithm === 'bestFirstButton') {
                window.location.href = 'index_8.html';
            }
        });
    });
});


// Set Map as default active algorithm
document.getElementById('mapButton').classList.add('active');