const markers = [];

const API_SAFEGUARDS = {
    MAX_CALLS: 1000,
    SESSION_TIMEOUT_MINUTES: 2,
    enabled: true,
    callCount: 0,
    sessionStartTime: Date.now(),

    canMakeCall() {
        if (!this.enabled) {
            console.log("API calls are currently disabled.");
            return false;
        }

        if (this.callCount >= this.MAX_CALLS) {
            console.log(`Maximum API call limit (${this.MAX_CALLS}) reached. Disabling API calls.`);
            this.enabled = false;
            return false;
        }

        const currentTime = Date.now();
        const sessionDurationMs = currentTime - this.sessionStartTime;
        const sessionDurationMinutes = sessionDurationMs / (1000 * 60);

        if (sessionDurationMinutes >= this.SESSION_TIMEOUT_MINUTES) {
            console.log(`Session timeout (${this.SESSION_TIMEOUT_MINUTES} minutes) reached. Disabling API calls.`);
            this.enabled = false;
            return false;
        }

        return true;
    },

    incrementCallCount() {
        this.callCount++;
        console.log(`API call count: ${this.callCount}/${this.MAX_CALLS}`);

        if (this.callCount === Math.floor(this.MAX_CALLS * 0.8)) {
            console.warn(`Warning: Approaching API call limit (${this.callCount}/${this.MAX_CALLS})`);
        }
    },

    reset() {
        this.callCount = 0;
        this.sessionStartTime = Date.now();
        this.enabled = true;
        console.log("API safeguards have been reset.");
    },

    enable() {
        this.enabled = true;
        console.log("API calls have been enabled.");
    },

    disable() {
        this.enabled = false;
        console.log("API calls have been disabled.");
    },

    getStatus() {
        const currentTime = Date.now();
        const sessionDurationMs = currentTime - this.sessionStartTime;
        const sessionDurationMinutes = sessionDurationMs / (1000 * 60);
        const timeRemaining = Math.max(0, this.SESSION_TIMEOUT_MINUTES - sessionDurationMinutes);

        return {
            enabled: this.enabled,
            callCount: this.callCount,
            maxCalls: this.MAX_CALLS,
            callsRemaining: this.MAX_CALLS - this.callCount,
            sessionDurationMinutes: sessionDurationMinutes.toFixed(2),
            sessionTimeoutMinutes: this.SESSION_TIMEOUT_MINUTES,
            timeRemainingMinutes: timeRemaining.toFixed(2)
        };
    }
};

// Helper function to call the Roads API's Snap to Roads endpoint with safeguards
async function snapToRoad(location) {
    if (!API_SAFEGUARDS.canMakeCall()) {
        console.warn("API call prevented by safeguards.");
        return null;
    }
    const apiKey = CONFIG.GOOGLE_MAPS_API_KEY;

    try {
        API_SAFEGUARDS.incrementCallCount();

        const response = await fetch(
            `https://roads.googleapis.com/v1/snapToRoads?path=${location.lat},${location.lng}&key=${apiKey}`
        );

        if (!response.ok) {
            throw new Error(`Google Roads API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        if (data.snappedPoints && data.snappedPoints.length > 0) {
            return {
                lat: data.snappedPoints[0].location.latitude,
                lng: data.snappedPoints[0].location.longitude
            };
        } else {
            console.log("No snapped point found for location:", location);
            return null;
        }
    } catch (error) {
        console.error("Error in snapToRoad:", error);
        return null;
    }
}

async function calculateIntersectionNeighbors_2(node) {
    const lat = node.lat;
    const lng = node.lng;

    // Increase lambda for a wider search area
    const lambda = 0.00045; // ~45 meters

    // Define cardinal and intermediate directions for better coverage
    const points = [
        {lat: lat + lambda, lng: lng, direction: "North"}, // North
        {lat: lat - lambda, lng: lng, direction: "South"}, // South
        {lat: lat, lng: lng + lambda, direction: "East"}, // East
        {lat: lat, lng: lng - lambda, direction: "West"}, // West
        {lat: lat + lambda * 0.7, lng: lng + lambda * 0.7, direction: "Northeast"}, // Northeast
        {lat: lat + lambda * 0.7, lng: lng - lambda * 0.7, direction: "Northwest"}, // Northwest
        {lat: lat - lambda * 0.7, lng: lng + lambda * 0.7, direction: "Southeast"}, // Southeast
        {lat: lat - lambda * 0.7, lng: lng - lambda * 0.7, direction: "Southwest"} // Southwest
    ];

    const neighbors = [];
    const allPoints = [];
    const alreadyProcessedPoints = new Set();
    const minDistanceForNewPoint = 25; // meters
    const maxRoadDistance = 20; // Maximum distance to consider a road "reachable"

    // Consider Google Roads API limitations - batch requests if possible
    const apiRequestDelay = 100 * currentSpeed; // ms between API calls to avoid rate limits

    for (const point of points) {
        // Check if we can make more API calls before continuing
        if (!API_SAFEGUARDS.canMakeCall()) {
            console.warn("API call limit reached. Stopping further processing.");
            break;
        }

        // Check if we're too close to existing points
        let tooCloseToExisting = false;

        // Convert the point to a string key for checking processed status
        const pointKey = `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`;
        // const pointKey = `${point.lat},${point.lng}`;

        // Skip if we've already processed this point
        if (alreadyProcessedPoints.has(pointKey)) {
            continue;
        }

        alreadyProcessedPoints.add(pointKey);

        // Check if this point is too close to any existing point in our map
        map_2.forEach((existingPoint) => {
            const distance = getDistance(existingPoint, point);
            if (distance < minDistanceForNewPoint) {
                tooCloseToExisting = true;
            }
        });

        if (!tooCloseToExisting) {
            // Add a small delay to avoid hitting API rate limits
            await new Promise(resolve => setTimeout(resolve, apiRequestDelay));

            // Try to snap to the nearest road
            try {
                const roadSegment = await snapToRoad(point);

                if (roadSegment) {
                    // Calculate the distance between the original point and the snapped road point
                    const distanceToRoad = getDistance(point, roadSegment);

                    if (distanceToRoad <= maxRoadDistance) {
                        // This is a reachable road
                        const roadKey = `${roadSegment.lat.toFixed(6)},${roadSegment.lng.toFixed(6)}`;

                        // Check if we already have this exact road point
                        if (!map_2.has(roadKey)) {
                            // Add direction and distance information to the roadSegment
                            const enhancedRoadSegment = {
                                ...roadSegment,
                                distanceToRoad,
                                originalDirection: point.direction,
                                originalPoint: {lat: point.lat, lng: point.lng}
                            };

                            neighbors.push(enhancedRoadSegment);
                            map_2.set(roadKey, roadSegment);
                            allPoints.push(enhancedRoadSegment);

                            console.log(`Found road in ${point.direction} direction, distance: ${distanceToRoad.toFixed(2)}m`);
                        }
                    } else {
                        console.log(`Road in ${point.direction} direction too far: ${distanceToRoad.toFixed(2)}m > ${maxRoadDistance}m`);
                    }
                } else {
                    console.log(`No road found in ${point.direction} direction`);
                }
            } catch (error) {
                console.error(`Error snapping to road in ${point.direction} direction:`, error);
            }
        }
    }

    // Filter neighbors to keep only the most relevant ones
    const filteredNeighbors = filterNodesByDistanceAndDirection(neighbors);

    console.log(`Found ${allPoints.length} total points, filtered to ${filteredNeighbors.length} neighbors`);
    return filteredNeighbors;
}

// Enhanced filtering function that considers both direction and distance
function filterNodesByDistanceAndDirection(neighbors) {
    if (neighbors.length <= 4) {
        // If we have 4 or fewer neighbors, keep them all
        return neighbors;
    }

    // Group by general cardinal direction (N, S, E, W)
    const directionGroups = {
        "North": [],
        "South": [],
        "East": [],
        "West": [],
        "Northeast": [],
        "Northwest": [],
        "Southeast": [],
        "Southwest": []
    };

    // Group neighbors by direction
    neighbors.forEach(neighbor => {
        if (neighbor.originalDirection) {
            directionGroups[neighbor.originalDirection].push(neighbor);
        }
    });

    // For each direction, keep the best candidate
    const filtered = [];

    Object.entries(directionGroups).forEach(([direction, group]) => {
        if (group.length > 0) {
            // Sort by distance to road (ascending)
            group.sort((a, b) => a.distanceToRoad - b.distanceToRoad);

            // Keep the closest one
            filtered.push(group[0]);

            // If there's a significant gap between points in the same direction
            // (e.g., two separate roads), consider keeping the second point too
            if (group.length > 1 &&
                group[1].distanceToRoad < maxRoadDistance &&
                getDistance(group[0], group[1]) > 100) {
                filtered.push(group[1]);
            }
        }
    });

    return filtered;
}

const map_2 = new Map();

function getDistance(point1, point2) {
    const R = 6371; // Earth radius in kilometers
    const dLat = (point2.lat - point1.lat) * (Math.PI / 180);
    const dLng = (point2.lng - point1.lng) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(point1.lat * (Math.PI / 180)) *
        Math.cos(point2.lat * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // console.log("DISTANCE", R * c * 1000);

    return R * c * 1000; // Return distance in meters
}

function placeMarker(node, color) {
    // Create and place the map marker at node's latitude and longitude
    const marker = new google.maps.Marker({
        position: {lat: node.lat, lng: node.lng},
        map: map,
        title: `${color.charAt(0).toUpperCase() + color.slice(1)} Node`,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 5,
            fillColor: color,
            fillOpacity: 0.6,
            strokeWeight: 1,
            strokeColor: "white"
        }
    });

    markers.push(marker);
}

function toKey(node) {
    return `${node.lat},${node.lng}`;
}