let map;
let placesService;
let directionsService;
let directionsRenderer;

function loadGoogleMapsScript() {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${CONFIG.GOOGLE_MAPS_API_KEY}&callback=initMap&libraries=places&callback=initMap`;
    script.async = true;
    document.head.appendChild(script);
}

function initMapSettings() {
    const mapStyles = [
        {
            "featureType": "all",
            "elementType": "all",
            "stylers": [{"saturation": 32}, {"lightness": -1}, {"visibility": "on"}]
        },
        {"featureType": "road", "elementType": "geometry", "stylers": [{"color": "#d4d4d4"}]},
        {"featureType": "water", "elementType": "geometry", "stylers": [{"color": "#00bfff"}]},
        {"featureType": "landscape", "elementType": "geometry", "stylers": [{"color": "#e6e6e6"}]},
        // Remove icons for points of interest (including ports)
        {"featureType": "poi", "elementType": "geometry", "stylers": [{"visibility": "off"}]},
        {"featureType": "poi", "elementType": "labels", "stylers": [{"visibility": "off"}]},
        // Remove transit stations including metro
        {"featureType": "transit", "elementType": "geometry", "stylers": [{"visibility": "off"}]},
        {"featureType": "transit", "elementType": "labels", "stylers": [{"visibility": "off"}]},
        {"featureType": "road", "elementType": "labels", "stylers": [{"visibility": "off"}]}
    ];


    // Initialize the map with custom styles and options
    const mapOptions = {
        center: {lat: 40.7128, lng: -74.0060}, // New York City coordinates
        zoom: 14,
        styles: mapStyles,
        draggable: true,
        scrollwheel: true,
        disableDefaultUI: true,
        zoomControl: false,
        streetViewControl: false,
        mapTypeControl: false,
    };

    map = new google.maps.Map(document.getElementById("map"), mapOptions);
    placesService = new google.maps.places.PlacesService(map);

    map.addListener("rightclick", function (event) {
        showContextMenu(event);
    });

    // Initialize the Directions Service and Renderer
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: '#FF0000',
            strokeOpacity: 0.7,
            strokeWeight: 2
        }
    });

    directionsRenderer.setMap(map);
}

// Load map and map settings
loadGoogleMapsScript();

updateStartButtonText();

window.initMap = initMapSettings;