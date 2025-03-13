let startMarker = null;
let endMarker = null;

// context menu ( start / finish ) point
function showContextMenu(event) {
    if (contextMenu) {
        contextMenu.remove();
    }

    contextMenu = document.createElement("div");
    contextMenu.classList.add("context-menu");
    contextMenu.style.left = event.pixel.x + "px";
    contextMenu.style.top = event.pixel.y + "px";

    const startOption = document.createElement("div");
    startOption.innerText = "Set Start Point";
    startOption.onclick = () => {
        setStartPoint(event.latLng);
        contextMenu.remove();
    };

    const endOption = document.createElement("div");
    endOption.innerText = "Set End Point";
    endOption.onclick = () => {
        setEndPoint(event.latLng);
        contextMenu.remove();
    };

    contextMenu.appendChild(startOption);
    contextMenu.appendChild(endOption);

    // Append the context menu to the map container
    map.getDiv().appendChild(contextMenu);

    document.addEventListener("click", handleOutsideClick);
}

// Outside context menu click
function handleOutsideClick(event) {
    if (contextMenu && !contextMenu.contains(event.target)) {
        contextMenu.remove();
        contextMenu = null;
        document.removeEventListener("click", handleOutsideClick);
    }
}

// Setting start point
function setStartPoint(position) {
    if (startMarker) {
        startMarker.setMap(null);
    }

    startMarker = new google.maps.Marker({
        position: position,
        map: map,
        title: "Start Point",
        draggable: true,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "green",
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: "white"
        }
    });

    updateStartButtonText();
}

// Setting finish point
function setEndPoint(position) {
    if (endMarker) {
        endMarker.setMap(null);  // Remove existing end marker if exists
    }

    endMarker = new google.maps.Marker({
        position: position,
        map: map,
        title: "End Point",
        draggable: true,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: "red",
            fillOpacity: 1,
            strokeWeight: 1,
            strokeColor: "white"
        }
    });

    updateStartButtonText();
}