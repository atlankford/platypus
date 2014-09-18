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
var parentDomain = "http://localhost:8080/";
var parentDomainLength = parentDomain.length;
var plat;
var platId;
var message;
var followMode;
var mapLock;
var textMessage = "Someone wants to share their location with you on PLAT.  Check it out at ";
var emailMessage = "Someone wants to share their location with you on PLAT.  Check it out at ";
//Map styles string
var mapStyles = [
    {"featureType": "road", "elementType": "geometry", "stylers": [
        {"lightness": 100},
        {"visibility": "simplified"}
    ]},
    {"featureType": "water", "elementType": "geometry", "stylers": [
        {"visibility": "on"},
        {"color": "#C6E2FF"}
    ]},
    {"featureType": "poi", "elementType": "geometry.fill", "stylers": [
        {"color": "#C5E3BF"}
    ]},
    {"featureType": "road", "elementType": "geometry.fill", "stylers": [
        {"color": "#D1D1B8"}
    ]}
];

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
var emailLink = function(){
    $('#emailModal').modal('show');
    $('#myModal2').modal('hide');
}
var textLink = function(){
    $('#textModal').modal('show');
    $('#myModal2').modal('hide');
}

var sendEmail = function(x){
    $('#emailModal').modal('hide');

    console.log(x);
    firebaseRef.child('email').push({id: uniqueId, message: emailMessage, link: parentDomain + '?' + uniqueId, email: x.value})

}
var sendText = function(x){
    $('#textModal').modal('hide');

    console.log(x);

    firebaseRef.child('text').push({id: uniqueId, message: textMessage, link: parentDomain + '?' + uniqueId, text: x.value})

}

var share = function () {

    //hide modal
    $('#myModal2').modal('show');

    var shareLink = parentDomain + "?" + uniqueId;
    var twitterLink = "http://twitter.com/share?text=Check%20my%20location%20on%20PLAT%20&url="+ shareLink + '&hashtags=PLAT';


//    document.getElementById("share-link-input").value = shareLink;

    document.getElementById("share-link").innerHTML = shareLink;
    document.getElementById("tweet").setAttribute('href',twitterLink) ;

    $('.popup').click(function(event) {
        var width  = 575,
            height = 400,
            left   = ($(window).width()  - width)  / 2,
            top    = ($(window).height() - height) / 2,
            url    = shareLink,
            opts   = 'status=1' +
                ',width='  + width  +
                ',height=' + height +
                ',top='    + top    +
                ',left='   + left;

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
        zoom: 10,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: mapStyles,
        panControl: false,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        overviewMapControl: false
    });



}

var initializeFollowMap = function () {

    var start = window.location.href.indexOf('?');
    var end = window.location.href.length;

    console.log(window.location.href + "     start # is " + start + "and end # is "+ end);

    platId = window.location.href.slice(start + 1, end).toUpperCase();

    console.log(platId)

    firebaseRef.child(platId).once('value', function (dataSnapshot) {

        plat = dataSnapshot.val();

        latitude = plat.l[0];
        longitude = plat.l[1];

        // Get the location as a Google Maps latitude-longitude object
        var loc = new google.maps.LatLng(plat.l[0], plat.l[1]);
        // Create the Google Map
        map = new google.maps.Map(document.getElementById("map-canvas"), {
            center: loc,
            zoom: 20,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            styles: mapStyles,
            panControl: false,
            zoomControl: false,
            mapTypeControl: false,
            scaleControl: false,
            streetViewControl: false,
            overviewMapControl: false
        });

    }, function (err) {
        alert("Something went wrong")
    });



};

var updateFollowMap = function () {
    var start = window.location.href.indexOf('?');
    var end = window.location.href.length;

    platId = window.location.href.slice(start + 1, end).toUpperCase();

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
    var usersOnMap = {};

//    if(latitude = " "){
//        var geoQuery = geoFire.query({
//            center: [30.3369, -81.6614],
//            radius: radiusInKm
//        });
//    }
//    else{
    var geoQuery = geoFire.query({
        center: [latitude, longitude],
        radius: radiusInKm
    });
//    }



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
            user.message

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


        if (key == platId){
            stopFollowing();
            alert("User at " + key + " is no longer broadcasting")
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

    //resets the broadcast button
    document.getElementById("plot-button").style.visibility = "visible";
    document.getElementById("stop-button").style.visibility = "hidden";
    document.getElementById("share").style.visibility = "hidden";
    document.getElementById("lock").style.visibility = "hidden";


    //removes user location from database
    firebaseRef.child(uniqueId).remove();


    //clears interval that get user's new location every 30 seconds
    clearInterval(updateCurrentUserLocation);

}

var startBroadcast = function (x,y) {

    x = x.value.replace(' ', '_');
    message = y.value;
    uniqueId = x.toUpperCase();


    if (uniqueId.length == 0) {
        //show alert
        console.log("error length is == 0");


    }
    else if (uniqueId.length > 14) {
        //show alert
        console.log("error length is > 14");

    }
    // else if(uniqueId contains ".", "#", "$", "[", or "]") {}
    else {
        firebaseRef.once('value', function (snapshot) {
            if (!snapshot.hasChild(uniqueId)) {


                //start broadcast

                //change broadcast button
                document.getElementById("share").style.visibility = "visible";
                document.getElementById("lock").style.visibility = "visible";

                document.getElementById("plot-button").style.visibility = "hidden";
                document.getElementById("stop-button").style.visibility = "visible";
                document.getElementById("stop-button").innerHTML = "Stop Broadcast #" + uniqueId;


                //hide modal
                $('#myModal').modal('hide');

                // Get the current user's location
                getLocation();

                addUserToDatabase();


                //set up timer to get user's new location every 10 seconds
                updateCurrentUserLocation = setInterval(function () {

                    getUpdatedLocation();

                }, 10000);

            }
            else {
                alert('Someone is already using that key')
            }
        });

    }



}

var startFollowing = function () {

    //change broadcast button
    document.getElementById("stop-following-button").style.visibility = "visible";
    document.getElementById("stop-following-button").innerHTML = "Stop Following Broadcast #" + platId;

    //set up timer to get user's new location every 10 seconds
    updateFollowUserLocation = setInterval(function () {

        updateFollowMap();

    }, 10000);


}

var stopFollowing = function () {

    //resets the broadcast button
    document.getElementById("plot-button").style.visibility = "visible";
    document.getElementById("stop-following-button").style.visibility = "hidden";

    //clears interval that get user's new location every 30 seconds
    clearInterval(updateFollowUserLocation);
    window.location.href = parentDomain;

}


//initial page load method
var init = function () {

    if (window.location.href.slice(parentDomainLength, parentDomainLength + 1) == '?') {
        //resets the broadcast button
        document.getElementById("finding-message").style.visibility = "visible";
        document.getElementById("loading").style.visibility = "visible";

        document.getElementById("overlay-button").style.visibility = "hidden";

//        ****for testing link redirect******
//        console.log("http://localhost:8080/sfVehicles/?1410711974760");
//        console.log(parentDomain + ":" + parentDomainLength);
//        console.log(window.location.href.slice(parentDomainLength, parentDomainLength + 1));
//        console.log(window.location.href.slice(parentDomainLength + 1, parentDomainLength + 14));

        followMode = true;



        setTimeout(function () {

            //build map following at id in url
            initializeFollowMap();

            setTimeout(function () {

                document.getElementById("overlay").style.visibility = "hidden";
                document.getElementById("finding-message").style.visibility = "hidden";
                document.getElementById("loading").style.visibility = "hidden";


                geoListen();

                startFollowing();



            }, 3000)

        }, 5000)


    }
    else {

        document.getElementById("overlay-button").style.visibility = "visible";


        //get user location then builds map and listens to database
        getLocation();

        setTimeout(function () {
            //build map now that you have user location
            initializeMap();

            //Starts listening to database changes
            geoListen();

        }, 5000)


    }
}


//load the page and map
window.onload = function () {
// detectBrowser();
    init();
}

//--------------------------------------------------------
//Helper Methods
//--------------------------------------------------------

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

        console.log("User # " + uniqueId + "'s location has been added to the database");

        firebaseRef.child(uniqueId).update({"message" : message});

        // When the user disconnects from Firebase (e.g. closes the app, exits the browser),
        // remove their GeoFire entry
        firebaseRef.child(uniqueId).onDisconnect().remove();

        console.log("Added handler to remove user #" + uniqueId + "'s from map when you leave this page.");
    })
}

/* Adds a marker for the user to the map */
function createUserMarker(user) {

    console.log("creating marker for new user at " + user.l[0] + "," + user.l[0]);

    var marker = new google.maps.Marker({
        position: new google.maps.LatLng(user.l[0], user.l[1]),
        optimized: true,
        icon: 'img/marker/pin.png',
        map: map,
        title: user.id

    });
    var content = "Loan Number: ";
    var infowindow = new google.maps.InfoWindow()

     var directionsLink = 'https://www.google.com/maps/@' + user.l[0] + ',' + user.l[1];

    console.log(marker);
    var contentString = '<div id="content">'+
        '<div id="siteNotice">'+
        '</div>'+
        '<h1 id="firstHeading" class="firstHeading"><b>' +
        user.id +
        '</b></h1><br>'+
        '<div id="bodyContent">'+
        '<p> ' + user.message +
        '</p>'+ '<br>' +
        '<p><a href="'+ directionsLink +'" target="_blank">'+
        'Get Directions to here</a> '+
        '</p>'+
        '</div>'+
        '</div>';

    var infowindow = new google.maps.InfoWindow({
        content: contentString
    });


    google.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map,marker);
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

var enterSite = function () {
    //change broadcast button
    document.getElementById("plot-button").style.visibility = "visible";
    document.getElementById("overlay").style.visibility = "hidden";
    document.getElementById("overlay-button").style.visibility = "hidden";
    document.getElementById("desktop-ad").style.zIndex = 400;



}

var lock = function(){
    if(mapLock){
        mapLock = false;
        console.log(mapLock);

    }
    else if(!mapLock){
        mapLock = true;
        console.log(mapLock);
    }
}








