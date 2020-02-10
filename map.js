// 
// AccesstoAPI 
var url = "https://opensky-network.org/api/states/all?lamin=25&lomin=-20&lamax=45&lomax=5";
var planeIcon = L.icon({
    iconUrl: 'icons/plane.png',
    iconSize: [15, 30],
    iconAnchor: [10, 20],
    popupAnchor: [1, 1],
});
//Define Functions
function onEachFeature(feature, layer) {
    // debugger;
    // does this feature have a property named popupContent?
    // if (feature.properties && feature.properties.popupContent) {
    layer.bindPopup("<b>ID: </b>" + feature.properties.id + "<br> <b>Aircraft:</b> " + feature.properties[1] + " <br> <b>Velocity: </b>" + feature.properties[9] + "m/s" + " <br> <b>Country: </b>" + feature.properties[2] + " <br> <b>Time-Position: </b>" + Date(feature.properties[3]) + " <br> <b>Last Contact: </b>" + Date(feature.properties[4]));
    layer.setIcon(planeIcon);
    layer.setRotationAngle(feature.properties[10]);
    // }
}

function getCustomData(success, error) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.onload = function() {
        if (xhr.status === 200) {
            var res = convertToGeoJSON(xhr.responseText);
            success(res);
        } else {
            var e = new Error("HTTP Rquest")
            error(e, xhr.status);
        }
    };
    xhr.send();

    function convertToGeoJSON(input) {
        //convert input to Object, if it is of type string
        if (typeof(input) == "string") {
            input = JSON.parse(input);
        }
        var fs = {
            "type": "FeatureCollection",
            "features": []
        };
        // debugger;
        for (var i = 0; i < input.states.length; i++) {
            var ele = input.states[i];
            var feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [ele[5], ele[6]]
                },
                // "icon": "icons/plane.svg"
            };
            feature.properties = ele;
            //set the id
            feature.properties["id"] = i;

            //check that the elements are numeric and only then insert
            if (isNumeric(ele[5]) && isNumeric(ele[6])) {
                //add this feature to the features array
                fs.features.push(feature)
            }
        }


        //return the GeoJSON FeatureCollection
        return fs;
    }

    function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

}

var map = L.map('map'),
    clusters = L.markerClusterGroup({ maxClusterRadius: 40 }).addTo(map),
    realtime = L.realtime(getCustomData, {
        onEachFeature: onEachFeature,
        container: clusters,
        interval: 10 * 1000,
    }); //.addTo(map);

L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

realtime.once('update', function() {
    map.fitBounds(realtime.getBounds(), {
        maxZoom: 13
    });
    clusters.clearLayers();
    clusters.addLayer(realtime);
    console.log(arguments);
});