var map;
var marker;
var latitude;
var longitude;
var center;
var loc;
var uniqueId = new Date().getTime().toString();
var radiusInKm = 100000;
var updateCurrentUserLocation;
var firebaseUrl = "https://truk.firebaseio.com/";
var firebaseRef = new Firebase(firebaseUrl);
var geoFire = new GeoFire(firebaseRef);
var usersOnMap;
var parentDomain = "https://platio.mybluemix.net/";
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
var mapStyles = [{
    featureType: "road",
    elementType: "labels",
    stylers: [{
        visibility: "simplified"
    }, {
        lightness: 20
    }]
}, {
    featureType: "administrative.land_parcel",
    elementType: "all",
    stylers: []
}, {
    featureType: "landscape.man_made",
    elementType: "all",
    stylers: []
}, {
    featureType: "transit",
    elementType: "all",
    stylers: []
}, {
    featureType: "road.local",
    elementType: "labels",
    stylers: []
}, {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{
        visibility: "simplified"
    }]
}, {
    featureType: "road.highway",
    elementType: "labels",
    stylers: []
}, {
    featureType: "poi",
    elementType: "labels",
    stylers: []
}, {
    featureType: "road.arterial",
    elementType: "labels",
    stylers: []
}, {
    featureType: "water",
    elementType: "all",
    stylers: [{
        hue: "#a1cdfc"
    }, {
        saturation: 30
    }, {
        lightness: 49
    }]
}, {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{
        hue: "#f49935"
    }]
}, {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{
        hue: "#fad959"
    }]
}];
var myApp = new Framework7();
var $$ = Dom7;
var mainView = myApp.addView(".view-main", {
    dynamicNavbar: true,
    domCache: true,
    uniqueHistory: true
});
$$(document).on("ajaxStart", function() {
    myApp.showIndicator()
});
$$(document).on("ajaxComplete", function() {
    myApp.hideIndicator()
});
$$(document).on("pageInit", '.page[data-page="map"]', function(a) {
    mainView.showNavbar();
    $$("stop-broadcast-button").hide();
    if (followMode) {
        $$("#broadcast-button").hide();
        $$("#stop-following-button").show();
        followMap()
    } else {
        startMap()
    }
});
$$(document).on("pageInit", '.page[data-page="about"]', function(a) {
    myApp.closePanel()
});
$$(document).on("pageInit", '.page[data-page="share"]', function(a) {
    share()
});
var ptrContent = $$(".pull-to-refresh-content");
ptrContent.on("refresh", function(a) {
    setTimeout(function() {
        startApp();
        myApp.pullToRefreshDone()
    }, 2000)
});
var getLocation = function() {
    if (typeof navigator !== "undefined" && typeof navigator.geolocation !== "undefined") {
        navigator.geolocation.getCurrentPosition(geolocationCallback, errorHandler)
    } else {
        console.log("Your browser does not support the HTML5 Geolocation API, so this will not work.")
    }
};
var geolocationCallback = function(a) {
    latitude = a.coords.latitude;
    longitude = a.coords.longitude;
    center = [latitude, longitude];
    myApp.hideIndicator();
    $$("#launch-button").show()
};
var getUpdatedLocation = function() {
    if (typeof navigator !== "undefined" && typeof navigator.geolocation !== "undefined") {
        navigator.geolocation.getCurrentPosition(geoUpdatedLocationCallback, errorHandler)
    } else {
        console.log("Your browser does not support the HTML5 Geolocation API, so this app will not work.")
    }
};
var geoUpdatedLocationCallback = function(a) {
    var c = a.coords.latitude;
    var b = a.coords.longitude;
    if (!coordinatesAreEquivalent(latitude, c) || !coordinatesAreEquivalent(longitude, b)) {
        firebaseRef.child(uniqueId).update({
            l: {
                0: latitude,
                1: longitude
            }
        });
        firebaseRef.child(uniqueId).update({
            lastUpdate: Firebase.ServerValue.TIMESTAMP
        });
        latitude = c;
        longitude = b
    }
};
var sendEmail = function(a) {
    firebaseRef.child("email").push({
        id: uniqueId,
        message: emailMessage,
        link: parentDomain + "#" + uniqueId,
        email: a.value
    });
    mainView.goBack();
    myApp.addNotification({
        title: "PLAT",
        message: "An email with your broadcast link has been sent to " + a.value
    });
    a = null
};
var sendText = function(a) {
    firebaseRef.child("text").push({
        id: uniqueId,
        message: textMessage,
        link: parentDomain + "#" + uniqueId,
        text: a.value
    });
    mainView.goBack();
    myApp.addNotification({
        title: "PLAT",
        message: "A text message with your broadcast link has been sent to " + a.value
    });
    a = null
};
var share = function() {
    var a = parentDomain + "#" + uniqueId;
    var b = "http://twitter.com/share#text=Check%20my%20location%20on%20PLAT%20&url=" + a + "&hashtags=PLAT";
    document.getElementById("share-link").innerHTML = a;
    document.getElementById("tweet").setAttribute("href", b);
    $(".popup").click(function(g) {
        var e = 575,
            c = 400,
            i = ($(window).width() - e) / 2,
            h = ($(window).height() - c) / 2,
            d = a,
            f = "status=1,width=" + e + ",height=" + c + ",top=" + h + ",left=" + i;
        window.open(d, "twitter", f);
        return false
    })
};
var initializeMap = function() {
    var a = new google.maps.LatLng(latitude, longitude);
    map = new google.maps.Map(document.getElementById("map-canvas"), {
        center: a,
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: mapStyles,
        panControl: false,
        zoomControl: false,
        mapTypeControl: false,
        scaleControl: false,
        streetViewControl: false,
        overviewMapControl: false
    })
};

function broadcastExistsCallback(b, a) {
    if (a) {
        buildFollowMap()
    } else {
        myApp.alert("Sorry, that broadcast is no longer active!", "PLAT", function() {
            window.location.href = parentDomain
        })
    }
}

function checkIfBroadcastExists(a) {
    firebaseRef.child(a).once("value", function(b) {
        var c = (b.val() !== null);
        broadcastExistsCallback(a, c)
    })
}
var initializeFollowMap = function() {
    start = window.location.href.indexOf("#");
    end = window.location.href.length;
    platId = window.location.href.slice(start + 1, end).toUpperCase();
    checkIfBroadcastExists(platId)
};
var updateFollowMap = function() {
    firebaseRef.child(platId).once("value", function(a) {
        plat = a.val();
        latitude = plat.l[0];
        longitude = plat.l[1];
        var b = new google.maps.LatLng(plat.l[0], plat.l[1]);
        map.setCenter(b)
    })
};
var geoListen = function() {
    usersOnMap = {};
    var d = geoFire.query({
        center: [latitude, longitude],
        radius: radiusInKm
    });
    var c = d.on("ready", function() {});
    var e = d.on("key_entered", function(g, f, h) {
        usersOnMap[g] = true;
        waitToGetAllTheData = setTimeout(function() {
            firebaseRef.child(g).once("value", function(i) {
                user = i.val();
                user.id = g;
                if (user !== null && usersOnMap[g] === true) {
                    usersOnMap[g] = user;
                    user.marker = createUserMarker(user)
                }
            })
        }, 500)
    });
    var a = d.on("key_exited", function(g) {
        var f = usersOnMap[g];
        if (f !== true) {
            f.marker.setMap(null)
        }
        delete usersOnMap[g];
        if (g == platId) {
            $$("#stop-following-button").hide();
            myApp.addNotification({
                title: "PLAT",
                message: "That broadcast is no longer active.",
                onClose: function() {
                    stopFollowing()
                }
            })
        }
    });
    var b = d.on("key_moved", function(h, f, i) {
        var g = usersOnMap[h];
        if (typeof g !== "undefined" && typeof g.marker !== "undefined") {
            g.marker.animatedMoveTo(f)
        }
    })
};
var stopBroadcast = function() {
    $$("#share-button").hide();
    firebaseRef.child(uniqueId).remove();
    clearInterval(updateCurrentUserLocation);
    $$("#stop-broadcast-button").hide();
    $$("#broadcast-button").show()
};
var startBroadcast = function(a, b) {
    a = a.value.replace(" ", "_");
    message = b.value;
    uniqueId = a.toUpperCase();
    if (uniqueId.length == 0) {
        myApp.alert("Please enter a broadcast channel.")
    } else {
        if (uniqueId.length > 14) {
            myApp.alert("Please enter a broadcast handle less than 14 characters.")
        } else {
            firebaseRef.once("value", function(c) {
                if (!c.hasChild(uniqueId)) {
                    getLocation();
                    addUserToDatabase();
                    updateCurrentUserLocation = setInterval(function() {
                        getUpdatedLocation()
                    }, 10000)
                } else {
                    myApp.alert("Someone is already using that key")
                }
                mainView.goBack();
                $$("#share-button").show();
                $$("#stop-broadcast-button").show();
                $$("#broadcast-button").hide()
            })
        }
    }
};
var startFollowing = function() {
    geoListen();
    updateFollowUserLocation = setInterval(function() {
        updateFollowMap()
    }, 10000)
};
var stopFollowing = function() {
    clearInterval(updateFollowUserLocation);
    window.location.href = parentDomain
};
var startApp = function() {
    getLocation();
    setTimeout(function() {
        if (latitude === undefined) {
            myApp.alert("Please allow the browser to use your location", "PLAT", function() {
                getLocation()
            })
        }
    }, 6000)
};
var startMap = function() {
    initializeMap();
    geoListen()
};
window.onload = function() {
    console.log("You like to look under the hood?  Help us build it...contact us at team@plt.link.");

    if (isFollow()) {
        $$("#finding-broadcast").show();
        setTimeout(function() {
            initializeFollowMap()
        }, 3000)
    } else {
        myApp.showIndicator();
        startApp()
    }
};
var isFollow = function() {
    if (window.location.href.slice(parentDomainLength, parentDomainLength + 1) == "#") {
        followMode = true;
        return true
    } else {
        return false
    }
};
var coordinatesAreEquivalent = function(b, a) {
    return (Math.abs(b - a) < 0.000001)
};
var errorHandler = function(a) {
    if (a.code == 1) {
        console.log("Error: PERMISSION_DENIED: User denied access to their location")
    } else {
        if (a.code === 2) {
            console.log("Error: POSITION_UNAVAILABLE: Network is down or positioning satellites cannot be reached")
        } else {
            if (a.code === 3) {
                log("Error: TIMEOUT: Calculating the user's location too took long")
            } else {
                console.log("Unexpected error code")
            }
        }
    }
};

function addUserToDatabase() {
    geoFire.set(uniqueId, [latitude, longitude]).then(function() {
        firebaseRef.child(uniqueId).update({
            message: message,
            iconUrl: iconURL,
            lastUpdate: Firebase.ServerValue.TIMESTAMP
        });
        firebaseRef.child(uniqueId).onDisconnect().remove()
    })
}

function createUserMarker(b) {
    var a = new google.maps.Marker({
        position: new google.maps.LatLng(b.l[0], b.l[1]),
        optimized: true,
        icon: b.iconUrl,
        map: map,
        title: b.id
    });
    var d = '<div id="content"><div id="siteNotice"></div><h1 id="firstHeading" class="firstHeading"><b>' + b.id + '</b></h1><br><div id="bodyContent"><p> ' + b.message + "</p><br></div></div>";
    var c = new google.maps.InfoWindow({
        content: d
    });
    google.maps.event.addListener(a, "click", function() {
        c.open(map, a)
    });
    return a
}
google.maps.Marker.prototype.animatedMoveTo = function(g) {
    var e = g[0];
    var f = g[1];
    var h = this.getPosition().lat();
    var i = this.getPosition().lng();
    if (!coordinatesAreEquivalent(h, e) || !coordinatesAreEquivalent(i, f)) {
        var d = 0;
        var c = e - h;
        var b = f - i;
        var a = window.setInterval(function() {
            d += 0.01;
            var j = h + (d * c);
            var k = i + (d * b);
            var l = new google.maps.LatLng(j, k);
            this.setPosition(l);
            if (d >= 1) {
                window.clearInterval(a)
            }
        }.bind(this), 50)
    }
};
var detectBrowser = function() {
    var a = navigator.userAgent;
    var b = document.getElementById("map-canvas");
    if (a.indexOf("iPhone") != -1 || a.indexOf("Android") != -1) {
        b.style.width = "100%";
        b.style.height = "100%"
    } else {
        b.style.width = "600px";
        b.style.height = "800px"
    }
};
var lock = function() {
    if (mapLock) {
        mapLock = false
    } else {
        if (!mapLock) {
            mapLock = true
        }
    }
};
var setIcon = function(b) {
    var a = b.childNodes[1].childNodes[0];
    iconURL = a.src;
    document.getElementById("broadcast-icon").setAttribute("src", iconURL);
    mainView.goBack()
};
var buildFollowMap = function() {
    $$("#finding-broadcast").hide();
    mainView.loadPage("map.html")
};
var followMap = function() {
    firebaseRef.child(platId).once("value", function(a) {
        plat = a.val();
        latitude = plat.l[0];
        longitude = plat.l[1];
        var b = new google.maps.LatLng(plat.l[0], plat.l[1]);
        map = new google.maps.Map(document.getElementById("map-canvas"), {
            center: b,
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
        setTimeout(function() {
            startFollowing()
        }, 300)
    }, function(a) {
        alert("Something went wrong")
    })
};
var externalLink = function() {
    window.location.href = "http://www.about.plt.link"
};
