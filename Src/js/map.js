// **************************************************************************
// google map api
// **************************************************************************
var map;
var markers = [];
var infoWindows = [];

var API_KEY = 'AIzaSyDZQhR2ozyO8ezPJlxO6GOC9dM281nb_cQ';
function showGoogleMap(){

    // 서울시청
    var location = {
        lat : 37.56647, 
        lng: 126.977963
    };

    var mapOption = {
        zoom: 16,
        center: {lat: location.lat, lng: location.lng}
        // disableDefaultUI : false, 
        // disableDoubleClickZoom : false, 
        // draggable : true, 
        // keyboardShortcuts : true, 
        // maxZoom : 18, 
        // minZoom : 1 
    };

    map = new google.maps.Map(document.getElementById('map_canvas'), mapOption);
}

//google.maps.event.addDomListener(window, 'load', showGoogleMap);

// google.maps.event.addDomListener(window, 'resize', function() { 
//     var center = map.getCenter();
//     google.maps.event.trigger(map, 'resize');
//     map.setCenter(center); 
// });

function loadMarkerItems(tx, rs){
    if(rs.rows.length > 0){
        var pos;        // google.maps.LatLng
        
        // reset marker items
        for(var i = 0; i < markers.length; i++){
            markers[i].setMap(null);
        }

        // reset info window items
        for(var i = 0; i < infoWindows.length; i++){
            infoWindows[i].setMap(null);
        }

        markers.splice(0, markers.length);
        infoWindows.splice(0, infoWindows.length);

        for( var i = 0; i < rs.rows.length; i++){
            var row = rs.rows.item(i);
            
            renderMakers(row);

            if(i === (rs.rows.length - 1)){
               pos = new google.maps.LatLng(row.Lat, row.Lng);
            }
        }

        myTrip.webdb.getAllTripCount();

        map.setCenter(pos);
    }
}

function renderMakers(row){
    var id = row.Id;
    var lat = row.Lat;
    var lng = row.Lng;
    var title = row.Title;
    var comment = row.Comment;
    
    var pos = new google.maps.LatLng(lat, lng);

    comment =comment.replace(/(?:\r\n|\r|\n)/g, '<br />');

    var test = 'Lat: ' + lat;
    test += '<br />Lng: ' + lng;
    test += '<br />Title: ' + title;
    test += '<br />Comment: ' + comment;

    if(comment && comment.length > 0){
        // set Info window
        var infowindow = new google.maps.InfoWindow({
            map: map,
            position: pos,
            content: comment
        });

        infoWindows.push(infowindow);
    }

    // set maker
    var marker = new google.maps.Marker({
        position: pos,
        map: map,
        title: title,
        animation: google.maps.Animation.BOUNCE // DROP 
    });
    
    markers.push(marker);

    setTimeout(function(){
        marker.setAnimation(null);
    }, 3000);    
}