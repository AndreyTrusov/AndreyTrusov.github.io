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