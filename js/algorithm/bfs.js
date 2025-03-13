class Line {
    constructor(startNode, endNode, color = "blue") {
        this.startNode = startNode;
        this.endNode = endNode;
        this.color = color;
    }

    setMap(map) {
        this.polyline.setMap(map);
    }

    draw() {
        // Make sure we have valid nodes
        if (!this.startNode || !this.endNode) {
            console.error("Cannot draw edge: missing start or end node");
            return;
        }

        // Create path coordinates
        const path = [
            {lat: this.startNode.lat, lng: this.startNode.lng},
            {lat: this.endNode.lat, lng: this.endNode.lng}
        ];

        // Define line style options
        const lineOptions = {
            path: path,
            map: map,
            strokeColor: this.color || '#FF0000',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            geodesic: true,
            clickable: true
        };

        this.polyline = new google.maps.Polyline(lineOptions);

        // click event to the line
        // this.polyline.addListener('click', () => {
        //     console.log(`Edge clicked: ${this.startNode.lat} to ${this.endNode.lat}`);
        // });

        return this.polyline;
    }
}

let lines = [];

async function bfsPathfinding(start, end) {
    const visited = new Set();
    const parentMap = new Map();
    const queue = [start];
    lines = [];

    visited.add(toKey(start));
    placeMarker(start, "green");

    logMessage("Queue initialized with start node:", start.lng + "/" + start.lat);

    if (stepMode) {
        await waitUntilRunning();
        nextStepReady = !nextStepReady;
    }

    while (queue.length > 0) {
        if (!bfsRunning && !stepMode) {
            await waitUntilRunning();
        }

        const current = queue.shift();

        if (areCoordinatesEqual(current, end)) {
            logMessage("End node found! Reconstructing path.");

            // Draw a line from the last node to the end node
            const line = new Line(current, end, "black");
            lines.push(line);
            line.draw();

            bfsRunning = true;
            toggleBfs();
            return reconstructPath(parentMap, current, lines);
        }

        placeMarker(current, "yellow");
        console.log("Marked node as explored:", current);
        logMessage("Marked node as explored:", current);

        const neighbors = await calculateIntersectionNeighbors_2(current);
        console.log("Neighbors calculated for node:", current, "->", neighbors);

        if (stepMode) {
            await waitUntilRunning();
        }

        for (const neighbor of neighbors) {
            if (stepMode) {
                await waitUntilRunning();
            }

            const key = toKey(neighbor);

            if (!visited.has(key)) {
                console.log("Visiting new neighbor:", neighbor);
                logMessage("Visiting new neighbor:", neighbor);

                visited.add(key);
                queue.push(neighbor);
                parentMap.set(key, current);

                console.log("Neighbor added to queue:", neighbor);
                console.log("Parent of neighbor set:", neighbor, "->", current);

                placeMarker(neighbor, "blue");

                // Draw a line between the current node and its neighbor
                const line = new Line(current, neighbor);
                lines.push(line);
                line.draw();

                if (stepMode) {
                    await waitUntilRunning();
                }
            } else {
                console.log("Neighbor already visited, skipping:", neighbor);
                logMessage("Neighbor already visited, skipping:", neighbor);
            }
        }

        if (setSpeedMode) {
            await delay(1000 * currentSpeed);
        }
    }

    console.log("No path found to end node.");
    logMessage("No path found to end node.");
    return null;
}

function reconstructPath(parentMap, endNode, lines) {
    let path = [];
    let currentNode = endNode;

    // console.log("Reconstructing path from end node:", currentNode);
    // console.log("Parent Map:", parentMap);

    while (currentNode && parentMap.has(toKey(currentNode))) {
        path.push(currentNode);
        placeMarker(currentNode, "black");

        // Get the parent of the current node
        const parentNode = parentMap.get(toKey(currentNode));

        // Debug: Log the current node and its parent
        // console.log("Current Node:", currentNode);
        // console.log("Parent Node:", parentNode);

        // if (parentNode) {
        // Draw a line between the current node and its parent
        const line = new Line(parentNode, currentNode, "black");
        lines.push(line);
        line.draw();
        // }

        // Move to the parent node
        currentNode = parentNode;
    }

    // Add the start node to the path (if it exists)
    if (currentNode) {
        path.push(currentNode);
        placeMarker(currentNode, "black");
    }

    // Reverse the path to get the correct order (start -> end)
    path.reverse();

    return path;
}

// Helper functions
function toKey(node) {
    return `${node.x},${node.y}`;
}

function areCoordinatesEqual(node1, node2) {
    const distance = getDistance(node1, node2);

    return distance < 30;
}

function placeMarker(node, color) {
    console.log(`Placing ${color} marker at node:`, node);
}

function logMessage(message, data) {
    console.log(message, data);
}

function waitUntilRunning() {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (bfsRunning || stepMode) {
                clearInterval(interval);
                resolve();
            }
        }, 100);
    });
}

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}