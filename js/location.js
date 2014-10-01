// Global map variable
var map;
//Global map marker varible
var marker;
//Global latitude
var latitude;
//Global longitude
var longitude;
//Global location to supplement unkown user location
var center;
//Global Google maps location object with current users location
var loc;
//Unique Id used to ananomously identify user, changes on refresh, based on seconds since 1970
var uniqueId = new Date().getTime().toString();
// Query radius
var radiusInKm = 100000;
//var that stores setInterval function to start and stop updating users location
var updateCurrentUserLocation;
//firebase url
var firebaseUrl = "https://truk.firebaseio.com/";
//new firebase instance
var firebaseRef = new Firebase(firebaseUrl);
//new geoFire instance
var geoFire = new GeoFire(firebaseRef);
var usersOnMap;
var parentDomain = "http://localhost:8080/";
var parentDomainLength = parentDomain.length;
var plat;
var platId;
var message;
var followMode = false;
var mapLock;
var textMessage = "Someone wants to share their location with you on PLAT.  Check it out at ";
var emailMessage = "Someone wants to share their location with you on PLAT.  Check it out at ";
var start;
var end;
var iconURL = "img/marker/markers/animals/adium.png";

//Map styles string
var mapStyles = [
    {"featureType": "road", "elementType": "labels", "stylers": [
        {"visibility": "simplified"},
        {"lightness": 20}
    ]},
    {"featureType": "administrative.land_parcel", "elementType": "all", "stylers": [
        {"visibility": "off"}
    ]},
    {"featureType": "landscape.man_made", "elementType": "all", "stylers": [
        {"visibility": "off"}
    ]},
    {"featureType": "transit", "elementType": "all", "stylers": [
        {"visibility": "off"}
    ]},
    {"featureType": "road.local", "elementType": "labels", "stylers": [
        {"visibility": "simplified"}
    ]},
    {"featureType": "road.local", "elementType": "geometry", "stylers": [
        {"visibility": "simplified"}
    ]},
    {"featureType": "road.highway", "elementType": "labels", "stylers": [
        {"visibility": "simplified"}
    ]},
    {"featureType": "poi", "elementType": "labels", "stylers": [
        {"visibility": "off"}
    ]},
    {"featureType": "road.arterial", "elementType": "labels", "stylers": [
        {"visibility": "off"}
    ]},
    {"featureType": "water", "elementType": "all", "stylers": [
        {"hue": "#a1cdfc"},
        {"saturation": 30},
        {"lightness": 49}
    ]},
    {"featureType": "road.highway", "elementType": "geometry", "stylers": [
        {"hue": "#f49935"}
    ]},
    {"featureType": "road.arterial", "elementType": "geometry", "stylers": [
        {"hue": "#fad959"}
    ]}
];

//------------------------App stuff--------------------------------------------
// Initialize your app
var myApp = new Framework7();

// Export selectors engine
var $$ = Dom7;

// Add view
var mainView = myApp.addView('.view-main', {
    dynamicNavbar: true,
    domCache: true,
    uniqueHistory: true

});


$$(document).on('ajaxStart', function () {
    myApp.showIndicator();
});
$$(document).on('ajaxComplete', function () {
    myApp.hideIndicator();
});


// Option 2. Using live 'pageInit' event handlers for each page
$$(document).on('pageInit', '.page[data-page="map"]', function (e) {

    if (followMode) {
        $$('#broadcast-button').hide();

        $$('#stop-following-button').show();

    }

    mainView.showNavbar();

    $$('stop-broadcast-button').hide();

    startMap();


})

// Option 2. Using live 'pageInit' event handlers for each page
$$(document).on('pageInit', '.page[data-page="share"]', function (e) {

    share();

})


// Pull to refresh content
var ptrContent = $$('.pull-to-refresh-content');

// Add 'refresh' listener on it
ptrContent.on('refresh', function (e) {
    // Emulate 2s loading
    setTimeout(function () {

        startApp();

        // When loading done, we need to reset it
        myApp.pullToRefreshDone();

    }, 2000);
});


//-------------------------End Global Variables--------------------------------------------

/* Uses the HTML5 geolocation API to get the current user's location */
var getLocation = function () {
    if (typeof navigator !== "undefined" && typeof navigator.geolocation !== "undefined") {
        console.log("Asking user to get their location......");
        navigator.geolocation.getCurrentPosition(geolocationCallback, errorHandler);
    } else {
        console.log("Your browser does not support the HTML5 Geolocation API, so this will not work.")
    }
};

/* Callback method from the geolocation API which receives the current user's location */
var geolocationCallback = function (location) {

    console.log("Current user # is " + uniqueId);

    latitude = location.coords.latitude;
    longitude = location.coords.longitude;
    center = [latitude, longitude];
    $$('#launch-button').show();
    console.log("Retrieved user # " + uniqueId + "'s location: [" + latitude + ", " + longitude + "]");

}

/* Uses the HTML5 geolocation API to get the current user's updated location */
var getUpdatedLocation = function () {
    if (typeof navigator !== "undefined" && typeof navigator.geolocation !== "undefined") {
        console.log("Asking user # " + uniqueId + " for an updated position......");
        navigator.geolocation.getCurrentPosition(geoUpdatedLocationCallback, errorHandler);
    } else {
        console.log("Your browser does not support the HTML5 Geolocation API, so this demo will not work.")
    }
};

/* Callback method from the geolocation API which receives the current user's location */
var geoUpdatedLocationCallback = function (location) {

    var newLatitude = location.coords.latitude;
    var newLongitude = location.coords.longitude;


    if (!coordinatesAreEquivalent(latitude, newLatitude) || !coordinatesAreEquivalent(longitude, newLongitude)) {
        console.log("--NEW POSITION DETECTED--");
        console.log("Retrieved an UPDATED position [" + newLatitude + ", " + newLongitude + "]");

        geoFire.set(uniqueId, [latitude, longitude]).then(function () {

            console.log("User #" + uniqueId + "'s UPDATED position has been added to database");


        }).catch(function (error) {
            console.log("Error adding user " + uniqueId + "'s location to map");
        });

        latitude = newLatitude;
        longitude = newLongitude;
    }
    else {
        console.log("Retrieved the SAME position [" + latitude + ", " + longitude + "]");

    }
}
var emailLink = function () {

}
var textLink = function () {

}

var sendEmail = function (x) {

    console.log("sending email to " + x.value);

    firebaseRef.child('email').push({id: uniqueId, message: emailMessage, link: parentDomain + '#' + uniqueId, email: x.value});

    mainView.goBack();


    myApp.addNotification({
        title: 'PLAT',
        message: 'An email with your broadcast link has been sent to ' + x.value
    });

    x = null;

}
var sendText = function (x) {

    console.log("sending text to " + x.value);

    firebaseRef.child('text').push({id: uniqueId, message: textMessage, link: parentDomain + '#' + uniqueId, text: x.value});

    mainView.goBack();


    myApp.addNotification({
        title: 'PLAT',
        message: 'A text message with your broadcast link has been sent to ' + x.value
    });

    x = null;

}

var share = function () {


    var shareLink = parentDomain + "#" + uniqueId;

    var twitterLink = "http://twitter.com/share#text=Check%20my%20location%20on%20PLAT%20&url=" + shareLink + '&hashtags=PLAT';

    document.getElementById("share-link").innerHTML = shareLink;
    document.getElementById("tweet").setAttribute('href', twitterLink);

    $('.popup').click(function (event) {
        var width = 575,
            height = 400,
            left = ($(window).width() - width) / 2,
            top = ($(window).height() - height) / 2,
            url = shareLink,
            opts = 'status=1' +
                ',width=' + width +
                ',height=' + height +
                ',top=' + top +
                ',left=' + left;

        window.open(url, 'twitter', opts);

        return false;
    });

}

/*****************/
/*  GOOGLE MAPS  */
/*****************/
/* Initializes Google Maps */
var initializeMap = function () {

    // Get the location as a Google Maps latitude-longitude object
    var loc = new google.maps.LatLng(latitude, longitude);

    // Create the Google Map
    map = new google.maps.Map(document.getElementById("map-canvas"), {
        center: loc,
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: mapStyles,
        panControl: false,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        overviewMapControl: false
    });
    console.log("map function ran")

}


//TODO add check to see if broadcast exists
function broadcastExistsCallback(id, exists) {
    if (exists) {

        buildFollowMap();

    } else {

        myApp.alert('Sorry, that broadcast is no longer active!', 'PLAT', function () {
            window.location.href = parentDomain;
        });
    }
}

function checkIfBroadcastExists(id) {

    firebaseRef.child(id).once('value', function (snapshot) {
        var exists = (snapshot.val() !== null);
        broadcastExistsCallback(id, exists);
    });

}


var initializeFollowMap = function () {

    start = window.location.href.indexOf('#');
    end = window.location.href.length;

    console.log(window.location.href + "     start # is " + start + "and end # is " + end);

    platId = window.location.href.slice(start + 1, end).toUpperCase();

    console.log(platId)

    checkIfBroadcastExists(platId);

};

var updateFollowMap = function () {

    //get user at location from database
    firebaseRef.child(platId).once("value", function (dataSnapshot) {

        plat = dataSnapshot.val();

        latitude = plat.l[0];
        longitude = plat.l[1];

        // Get the location as a Google Maps latitude-longitude object
        var loc = new google.maps.LatLng(plat.l[0], plat.l[1]);


        map.setCenter(loc);

    });
};

var geoListen = function () {
    usersOnMap = {};

    var geoQuery = geoFire.query({
        center: [latitude, longitude],
        radius: radiusInKm
    });

    var onReadyRegistration = geoQuery.on("ready", function () {
        console.log("Page has loaded and fired all other events for initial data");
    });

    var onKeyEnteredRegistration = geoQuery.on("key_entered", function (key, location, distance) {


        console.log(key + " entered at " + location + " (" + distance + " km from center)");

        // Specify that the vehicle has entered this query

        usersOnMap[key] = true;

        // Look up the vehicle's data in the Transit Open Data Set
        firebaseRef.child(key).once("value", function (dataSnapshot) {
            // Get the vehicle data from the Open Data Set
            user = dataSnapshot.val();
//            user.message

            user.id = key;

            // If the vehicle has not already exited this query in the time it took to look up its data in the Open Data
            // Set, add it to the map
            if (user !== null && usersOnMap[key] === true) {
                // Add the vehicle to the list of vehicles in the query
                usersOnMap[key] = user;

                // Create a new marker for the vehicle
                user.marker = createUserMarker(user);
            }
        });

    });

    var onKeyExitedRegistration = geoQuery.on("key_exited", function (key) {
        console.log(key + " exited ");

        // Get the vehicle from the list of vehicles in the query
        var user = usersOnMap[key];

        // If the vehicle's data has already been loaded from the Open Data Set, remove its marker from the map
        if (user !== true) {
            user.marker.setMap(null);
        }

        // Remove the vehicle from the list of vehicles in the query
        delete usersOnMap[key];
        console.log("key is " + key);
        console.log("platID is " + platId);


        if (key == platId) {

            $$('#stop-following-button').hide();

            myApp.addNotification({
                title: 'PLAT',
                message: 'That broadcast is no longer active.',
                onClose: function () {
                    stopFollowing();
                }
            });
        }

    });

    var onKeyMovedRegistration = geoQuery.on("key_moved", function (key, location, distance) {
        console.log(key + " moved  to " + location + " (" + distance + " km from center)");
        var user = usersOnMap[key];

        // Animate the vehicle's marker
        if (typeof user !== "undefined" && typeof user.marker !== "undefined") {
            user.marker.animatedMoveTo(location);
        }
    });
}


var stopBroadcast = function () {

    $$('#share-button').hide();

    //removes user location from database
    firebaseRef.child(uniqueId).remove();


    //clears interval that get user's new location every 30 seconds
    clearInterval(updateCurrentUserLocation);

    $$('#stop-broadcast-button').hide();
    $$('#broadcast-button').show();


}

var startBroadcast = function (x, y) {

    x = x.value.replace(' ', '_');
    message = y.value;
    uniqueId = x.toUpperCase();


    if (uniqueId.length == 0) {
        //show alert
        console.log("error length is == 0");
        myApp.alert('Please enter a broadcast handle.')


    }
    else if (uniqueId.length > 14) {
        //show alert
        console.log("error length is > 14");
        myApp.alert('Please enter a broadcast handle less than 14 characters.')


    }
    //TODO
    // REGEX else if(uniqueId contains ".", "#", "$", "[", or "]") {}
    else {

        firebaseRef.once('value', function (snapshot) {

            if (!snapshot.hasChild(uniqueId)) {

                //start broadcast

                // Get the current user's location
                getLocation();

                addUserToDatabase();

                //set up timer to get user's new location every 10 seconds
                updateCurrentUserLocation = setInterval(function () {

                    getUpdatedLocation();

                }, 10000);

            }
            else {
                myApp.alert('Someone is already using that key')
            }

            mainView.goBack();
            $$('#share-button').show();
            $$('#stop-broadcast-button').show();
            $$('#broadcast-button').hide();

        });

    }


}

var startFollowing = function () {

    geoListen();
    //set up timer to get user's new location every 10 seconds
    updateFollowUserLocation = setInterval(function () {

        updateFollowMap();

    }, 10000);


}

var stopFollowing = function () {


    //clears interval that get user's new location every 30 seconds
    clearInterval(updateFollowUserLocation);

    window.location.href = parentDomain;

}


var startApp = function () {

    getLocation();

    setTimeout(function () {

        if (latitude === undefined) {

            myApp.alert('Please allow the browser to use your location', 'PLAT', function () {
                getLocation();

            });
        }

    }, 6000)

};

var startMap = function () {

    initializeMap();
    geoListen();

}


//load the page
window.onload = function () {

    if (isFollow()) {

        $$("#finding-broadcast").show();

        setTimeout(function () {

            initializeFollowMap();


        }, 5000)
    }
    else {
        startApp();
    }

}

//--------------------------------------------------------
//Helper Methods
//--------------------------------------------------------

var isFollow = function () {

    if (window.location.href.slice(parentDomainLength, parentDomainLength + 1) == '#') {
        followMode = true;
        return true;
    }
    else {
        return false;
    }


};


/* Returns true if the two inputted coordinates are approximately equivalent */
var coordinatesAreEquivalent = function (coord1, coord2) {
    console.log("Checking if coordinates are different......");

    return (Math.abs(coord1 - coord2) < 0.000001);
}

/* Handles any errors from trying to get the user's current location */
var errorHandler = function (error) {
    if (error.code == 1) {
        console.log("Error: PERMISSION_DENIED: User denied access to their location");
    } else if (error.code === 2) {
        console.log("Error: POSITION_UNAVAILABLE: Network is down or positioning satellites cannot be reached");
    } else if (error.code === 3) {
        log("Error: TIMEOUT: Calculating the user's location too took long");
    } else {
        console.log("Unexpected error code")
    }
};

function addUserToDatabase() {

    geoFire.set(uniqueId, [latitude, longitude]).then(function () {

        console.log("User # " + uniqueId + "'s location has been added to the database NEW MESSAGE");

        firebaseRef.child(uniqueId).update({'message': message, 'iconUrl': iconURL});

        // When the user disconnects from Firebase (e.g. closes the app, exits the browser),
        // remove their GeoFire entry
        firebaseRef.child(uniqueId).onDisconnect().remove();

        console.log("Added handler to remove user #" + uniqueId + "'s from map when you leave this page.");
    })
}

/* Adds a marker for the user to the map */
function createUserMarker(user) {

    console.log("creating marker for at url' " + user.iconUrl + "new user at " + user.l[0] + "," + user.l[0]);

    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(user.l[0], user.l[1]),
        optimized: true,
        icon: user.iconUrl,
        map: map,
        title: user.id

    });

    var content = "Loan Number: ";


//    var directionsLink = 'https://www.google.com/maps/@' + user.l[0] + ',' + user.l[1];

    console.log(marker);
    var contentString = '<div id="content">' +
        '<div id="siteNotice">' +
        '</div>' +
        '<h1 id="firstHeading" class="firstHeading"><b>' +
        user.id +
        '</b></h1><br>' +
        '<div id="bodyContent">' +
        '<p> ' + user.message +
        '</p>' + '<br>' +
        '</div>' +
        '</div>';

    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });


    google.maps.event.addListener(marker, 'click', function () {
        infowindow.open(map, marker);
    });


    return marker;
}


/* Animates the Marker class (based on https://stackoverflow.com/a/10906464) */
google.maps.Marker.prototype.animatedMoveTo = function (newLocation) {
    var toLat = newLocation[0];
    var toLng = newLocation[1];

    var fromLat = this.getPosition().lat();
    var fromLng = this.getPosition().lng();

    if (!coordinatesAreEquivalent(fromLat, toLat) || !coordinatesAreEquivalent(fromLng, toLng)) {
        var percent = 0;
        var latDistance = toLat - fromLat;
        var lngDistance = toLng - fromLng;
        var interval = window.setInterval(function () {
            percent += 0.01;
            var curLat = fromLat + (percent * latDistance);
            var curLng = fromLng + (percent * lngDistance);
            var pos = new google.maps.LatLng(curLat, curLng);
            this.setPosition(pos);
            if (percent >= 1) {
                window.clearInterval(interval);
            }
        }.bind(this), 50);
    }
};

var detectBrowser = function () {
    var useragent = navigator.userAgent;
    var mapdiv = document.getElementById("map-canvas");

    if (useragent.indexOf('iPhone') != -1 || useragent.indexOf('Android') != -1) {
        mapdiv.style.width = '100%';
        mapdiv.style.height = '100%';
    } else {
        mapdiv.style.width = '600px';
        mapdiv.style.height = '800px';
    }
}


var lock = function () {
    if (mapLock) {
        mapLock = false;
        console.log(mapLock);

    }
    else if (!mapLock) {
        mapLock = true;
        console.log(mapLock);
    }
}

var setIcon = function (icon) {
    var x = icon.childNodes[1].childNodes[0];
    iconURL = x.src;
    document.getElementById('broadcast-icon').setAttribute("src", iconURL);

    mainView.goBack();

};


var buildFollowMap = function () {

    firebaseRef.child(platId).once('value', function (dataSnapshot) {

        plat = dataSnapshot.val();

        latitude = plat.l[0];
        longitude = plat.l[1];

        // Get the location as a Google Maps latitude-longitude object
        var loc = new google.maps.LatLng(plat.l[0], plat.l[1]);
        // Create the Google Map
        map = new google.maps.Map(document.getElementById("map-canvas"), {
            center: loc,
            zoom: 18,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: mapStyles,
            panControl: false,
            zoomControl: false,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            overviewMapControl: false
        });

        $$("#finding-broadcast").hide();

        mainView.loadPage('map.html');


        setTimeout(function () {

            startFollowing();

        }, 3000)


    }, function (err) {
        alert("Something went wrong")
    });

}

