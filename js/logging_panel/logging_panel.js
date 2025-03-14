let logCounter = 1;

// log message
function logMessage(message) {
    const logContainer = document.getElementById("log-container");

    if (logContainer) {

        const logEntry = document.createElement("div");
        logEntry.textContent = `${logCounter} - ${message}`;
        logContainer.appendChild(logEntry);

        logCounter++;

        logContainer.scrollTop = logContainer.scrollHeight;
    } else {
        console.log("Log container not found:", message);
    }
}

function clearLogMessages() {
    const logContainer = document.getElementById("log-container");

    if (logContainer) {
        while (logContainer.firstChild) {
            logContainer.removeChild(logContainer.firstChild);
        }

        logCounter = 1;

        const initialMessage = document.createElement("div");
        initialMessage.textContent = "Log cleared";
        logContainer.appendChild(initialMessage);
    } else {
        console.log("Log container not found when attempting to clear logs");
    }
}