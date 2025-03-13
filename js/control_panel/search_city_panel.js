// Search city
function searchCity(cityName) {
    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ 'address': cityName }, function(results, status) {
        if (status === 'OK') {
            const latLng = results[0].geometry.location;
            const lat = latLng.lat();
            const lng = latLng.lng();

            map.setCenter(latLng);

            logMessage(`City found: ${cityName} at ${lat}, ${lng}`);
        } else {
            logMessage(`Geocode was not successful for the following reason: ${status}`);
        }
    });
}

document.getElementById("searchButton").addEventListener("click", function() {
    const cityName = document.getElementById("citySearch").value;
    if (cityName) {
        searchCity(cityName);
    }
    document.getElementById("citySearch").value = "";
});