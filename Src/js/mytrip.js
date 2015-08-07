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

google.maps.event.addDomListener(window, 'load', showGoogleMap);

// google.maps.event.addDomListener(window, 'resize', function() { 
//     var center = map.getCenter();
//     google.maps.event.trigger(map, 'resize');
//     map.setCenter(center); 
// });

var myTrip = {};
myTrip.webdb = {};
myTrip.webdb.db = null;
myTrip.webdb.open = function(){
    if(window.openDatabase == window.undefined) { 
        throw {
            name: 'NotSupportWebDB',
            message:'This web browser is not support Web DB.'
        }; 
    }

    var dbSize = 5 * 1024 * 1024;   // 5MB
    myTrip.webdb.db = openDatabase('myTrip', '1', 'my trip', dbSize);
};

myTrip.webdb.onError = function(tx, e) {
    console.log(e.message);
    alert('there has been an error: ' + e.message);
};

myTrip.webdb.onSuccess = function(tx, e) {
    myTrip.webdb.getAllTrip(loadTripItems);
};

myTrip.webdb.createTable = function(){
    var db = myTrip.webdb.db;
    var dropTable = '';
    dropTable += 'DROP TABLE myTrip';

    var createTable = '';
    createTable += 'CREATE TABLE IF NOT EXISTS myTrip (';
    createTable += 'Id      INTEGER PRIMARY KEY ASC, ';
    createTable += 'Lat     DOUBLE, ';
    createTable += 'Lng     DOUBLE, ';
    createTable += 'Title   TEXT, ';
    createTable += 'Comment TEXT, ';
    createTable += 'Url     TEXT, ';
    createTable += 'Visited DATETIME ';
    createTable += ')';

    db.transaction(function(tx){
        // DROP TABLE
        //tx.executeSql(dropTable, []);

        // CREATE TABLE
        tx.executeSql(createTable, []);
    });
};

myTrip.webdb.addTrip = function(location, title, comment, url) {
    var visited_date = new Date();
    var db = myTrip.webdb.db;

    db.transaction(function(tx){
        var sql_insert = 'INSERT INTO myTrip (Lat, Lng, Title, Comment, Url, Visited) VALUES (?, ?, ?, ?, ?, ?)';
        tx.executeSql(sql_insert, 
            [
                location.lat,
                location.lng,
                title,
                comment,
                url,
                visited_date
            ], 
            myTrip.webdb.onSuccess,
            myTrip.webdb.onError);
    });
};

myTrip.webdb.getAllTrip = function(renderFunc) {
    var db = myTrip.webdb.db;
    var sql_select = 'SELECT Id, Lat, Lng, Title, Comment, Url, Visited FROM myTrip';
    db.transaction(function(tx){
        tx.executeSql(sql_select, 
            [], 
            renderFunc, 
            myTrip.webdb.onError);
    });
};

myTrip.webdb.getAllTripCount = function() {
    var db = myTrip.webdb.db;
    var sql_select = 'SELECT count(*) as count FROM myTrip';
    db.transaction(function(tx){
        tx.executeSql(sql_select, 
            [], 
            function(tx, rs){
                var count = rs.rows[0]['count'];
                $('.badgeTripCount').text(count);
            }, 
            myTrip.webdb.onError);
    });
};

myTrip.webdb.deleteTrip = function(id){
    var db = myTrip.webdb.db;
    var sql_delete = 'DELETE FROM myTrip where Id = ?';
    db.transaction(function(tx){
        tx.executeSql(sql_delete, 
            [
                id
            ],
            myTrip.webdb.onSuccess,
            myTrip.webdb.onError);
    });
};

function loadTripItems(tx, rs){
    if(rs.rows.length > 0){
        var rowOutput = '';
        var tripItems = document.getElementById('tripItems');
        var pos;        // google.maps.LatLng
        // reset markers
        for(var i = 0; i < markers.length; i++){
            markers[i].setMap(null);
        }

        for(var i = 0; i < infoWindows.length; i++){
            infoWindows[i].setMap(null);
        }

        markers.splice(0, markers.length);
        infoWindows.splice(0, infoWindows.length);

        for( var i = 0; i < rs.rows.length; i++){
            var row = rs.rows.item(i);

            rowOutput += renderTrip(row);

            pos = new google.maps.LatLng(row.Lat, row.Lng);
        }

        tripItems.innerHTML = rowOutput;

        $('#tripItems li .badge').css({'cursor':'pointer'}).click(function(){
            var id = $(this).parents(2).attr('data-tripid');

            myTrip.webdb.deleteTrip(id);
            showAlertMessage('Deleted.');
        });

        myTrip.webdb.getAllTripCount();

        // set last location
        map.setCenter(pos);
        // if(pos){
        //     setTimeout(function(){
        //         map.setCenter(pos);
        //     }, 200);
        // }
    }
}

function renderTrip(row){
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

    return '<li class="list-group-item" data-tripid="' + id + '">' + test +
           '<span class="badge badge-danger">DEL</span></li>';
}

function init(){
    var message = '';
    try{
        myTrip.webdb.open();
        myTrip.webdb.createTable();
        myTrip.webdb.getAllTrip(loadTripItems);
    }
    catch(e){

        if(e.hasOwnProperty('message')){
            message = e.message;
            console.log(message);
        }
        else{
            message = e;
            console.log(message);
        }

        if(e.name === 'NotSupportWebDB'){
            // Not supported web browser.
            $('#messageLabel').text(message).attr({'title':'Reference page.'}).css({'cursor':'pointer'}).click(function(){

                open('http://caniuse.com/#search=web%20sql', 'caniuse');
                return false;
            });

            $('#btnAdd').prop('disabled', true);
            $('#todo').prop('disabled', true);
        }
    }
}

function addTrip(){
    // get geo location. :)
    navigator.geolocation.getCurrentPosition(function(position) {

        var location = {
            lat: position.coords.latitude, 
            lng: position.coords.longitude
        };

        var title = $('#title').val();
        var comment = $('#comment').val();
        var url = '';

        myTrip.webdb.addTrip(location, title, comment, url);
        
        $('#title').val('');
        $('#comment').val('');    

        showAlertMessage('saved.');  
    });
    
}

function showAlertMessage(message){
    $('.showmessage').show(100, function(){
        $(this).removeClass('hide').text(message);

        setTimeout(function(){
            $('.showmessage').empty().hide(1000, function(){
                $(this).addClass('hide');
            });
        }, 5000);
    });    
}

function hideAllTabs(){
    $('.container').each(function(index, item){ 
        var id_check = '';
        id_check = $(item).attr('id');
        
        if(id_check) { 
            $(item).hide(); 
            $(item).addClass('hide');
        } 
    });
}

function hideTabsExceptMe(selector){
    hideAllTabs();
    $(selector).removeClass('hide');
    $(selector).show();
}

$(document).ready(function(){

    $('#btnAdd').click(function(){
        // Title is required.
        // var title = $('#title').val();
        // if(title) {
        //    addTrip();
        // }
        // else{
        //     $('#title').focus();
        //     showAlertMessage('Title text is required!');
        // }

        // Title is optional.
        addTrip();

    });

    $('#navbar ul.nav li a').click(function(event){
        event.preventDefault();
        // alert($(this).text());

        //active
        $('#navbar ul.nav li').each(function(index, item){
            $(item).removeClass('active');   
        });
        
        hideAllTabs();
        
        $(this).parents(1).addClass('active');
        var name = $(this).attr('href');
        $(name).removeClass('hide');
        $(name).show();

        if($('#navbar').hasClass('in')){
            $('#navbar').removeClass('in');
        }

    });        
    
    //showGoogleMap();
    hideTabsExceptMe('#home');
    init();    
});


