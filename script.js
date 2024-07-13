import config from './config.js'; // Adjust the path as per your project structure

// Initialize map
function initMap(){
    // Map options
    var mapOptions = {
        zoom: 10,
        center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
    }
    // New map
    var map = new google.maps.Map(document.getElementById('map'), mapOptions);

    // Add event listener
    document.getElementById('locationForm').addEventListener('submit', function(e) {
        e.preventDefault();
        var location = document.getElementById('location').value; // Get location input
        var radius = document.getElementById('radius').value * 1609.34; // Convert miles to meters

        // Will find the zoom level based on radius
        var zoomLevel = getZoomLevel(radius);
        map.setZoom(zoomLevel);

        // Clear previous trails
        clearTrailList();

        // Call function with location and radius as parameters
        findTrails(location, radius, map);
    });
}

// Function to calculate zoom based on radius
function getZoomLevel(radius) {
    if (radius < 1700) return 14;
    else if (radius < 5000) return 13;
    else if (radius < 10000) return 12; 
    else if (radius < 20000) return 11;
    else return 10; 
}

// Function to clear the trail list
function clearTrailList() {
    var trailList = document.getElementById('trailList');
    trailList.innerHTML = ''; // Clear all child elements
}

function findTrails(location, radius, map) {
    var geocoder = new google.maps.Geocoder(); // Create a geocoder to convert addresses to geographic coordinates
    // Geocode the address input
    geocoder.geocode({ 'address': location }, function(results, status) {
        if (status === 'OK') {
            var userLocation = results[0].geometry.location; // Set userLocation to geographic coordinates of address
            map.setCenter(userLocation);
            // Perform search of nearby trails
            var service = new google.maps.places.PlacesService(map);
            service.nearbySearch({
                location: userLocation,
                radius: radius,
                type: ['park'] // Search for parks assuming trails will be under parks
            }, 
            function callback(results, status) {
                if (status === google.maps.places.PlacesServiceStatus.OK) { 
                    var trails = [];

                    // Sets up an array for the trails to store location and distance
                    for (var i = 0; i < results.length; i++) {
                        var place = results[i];
                        var distance = google.maps.geometry.spherical.computeDistanceBetween(userLocation, place.geometry.location);
                        if (distance <= radius) {
                            trails.push({
                                place: place,
                                distance: distance
                            });
                        }
                    }

                    // Sort trails by distance
                    trails.sort(function(a, b) {
                        return a.distance - b.distance;
                    });

                    // Creates markers and adds info to list by looping through trails array
                    for (var i = 0; i < trails.length; i++) {
                        createMarker(trails[i].place, map, userLocation, trails[i].distance);
                        addTrailToList(trails[i].place, userLocation, trails[i].distance);
                    }
                } else {
                    console.error('PlacesServiceStatus not OK:', status);
                }
            });
        } else {
            // Display an alert if the geocode was not successful
            alert('Geocode was not successful for the following reason: ' + status);
            console.error('Geocode error:', status);
        }
    });
}

// Create markers for all the identified trails/parks
function createMarker(place, map, userLocation) {
    var marker = new google.maps.Marker({
        map: map,
        position: place.geometry.location,
        draggable: false,
        animation: google.maps.Animation.DROP
    });

    // Calculate distance in miles
    var distance = google.maps.geometry.spherical.computeDistanceBetween(userLocation, place.geometry.location) / 1609.34;

    // Add an event listener to the marker to show an InfoWindow when clicked
    google.maps.event.addListener(marker, 'click', function() {
        var infowindow = new google.maps.InfoWindow({
            content: `${place.name}<br>Distance: ${distance.toFixed(2)} miles<br>Rating: ${place.rating ? place.rating : 'No rating available'}` // Display the place's name, distance, and rating in the InfoWindow
        });
        infowindow.open(map, marker);

        // Make sure infowindows close after 2 seconds
        setTimeout(function() {
            infowindow.close();
        }, 2000);
    });
}

// Add trail to the list with a Google search link and distance
function addTrailToList(place, userLocation) {
    var trailList = document.getElementById('trailList');
    var listItem = document.createElement('li');

    // Create link and search each of the identified parks in google
    var link = document.createElement('a');
    link.href = 'https://www.google.com/search?q=' + encodeURIComponent(place.name);
    link.target = '_blank'; // Open in a new tab
    link.textContent = place.name;

    // Add distance
    var distance = google.maps.geometry.spherical.computeDistanceBetween(userLocation, place.geometry.location) / 1609.34; // Convert meters to miles
    var distanceText = document.createElement('span');
    distanceText.textContent = ` - ${distance.toFixed(2)} miles`;

    // Add rating
    var ratingText = document.createElement('span'); //uses a span element to display if there is no rating available
    ratingText.textContent = ` - Rating: ${place.rating ? place.rating : 'No rating available'}`;

    listItem.appendChild(link);
    listItem.appendChild(distanceText);
    listItem.appendChild(ratingText);
    trailList.appendChild(listItem);
}

// Load Google Maps API with API key
function loadGoogleMaps() {
    var script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${config.API_KEY}&libraries=places,geometry&callback=initMap`;
    script.defer = true;
    script.async = true;
    document.head.appendChild(script);
}

// Call function to load Google Maps API
loadGoogleMaps();
