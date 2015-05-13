var map;
var geocoder;
var currentBounds;
var ne;
var sw;
var rectangle;
var pointarray, heatmap;




//HOME ICON
function HomeControl(controlDiv, map) {

    // Set CSS styles for the DIV containing the control
    // Setting padding to 5 px will offset the control
    // from the edge of the map
    controlDiv.style.padding = '5px';

    // Set CSS for the control border
    var controlUI = document.createElement('div');
    controlUI.style.marginLeft = '0vw';
    //controlUI.style.marginRight = '90vw';
    controlUI.style.backgroundColor = 'white';
    controlUI.style.borderStyle = 'solid';
    controlUI.style.borderWidth = '2px';
    controlUI.style.cursor = 'pointer';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Click to set the map to Home';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior
    var homeText = document.createElement('div');
    homeText.style.fontFamily = 'Arial,sans-serif';
    homeText.style.fontSize = '12px';
    homeText.style.paddingLeft = '4px';
    homeText.style.paddingRight = '4px';
    homeText.innerHTML = '<b>Home</b>';
    controlUI.appendChild(homeText);

    var rectUI = document.createElement('div');
    rectUI.style.marginLeft = '0vw';
    //rectUI.style.marginRight = '90vw';
    rectUI.style.backgroundColor = 'white';
    rectUI.style.borderStyle = 'solid';
    rectUI.style.borderWidth = '2px';
    rectUI.style.cursor = 'pointer';
    rectUI.style.textAlign = 'center';
    rectUI.style.marginTop = '10px';
    rectUI.title = 'Set Rectangle';
    controlDiv.appendChild(rectUI);
    rectUI.onclick = setRectangle_onclick;

    var rectText = document.createElement('div');
    rectText.style.fontFamily = 'Arial,sans-serif';
    rectText.style.fontSize = '12px';
    rectText.style.paddingLeft = '4px';
    rectText.style.paddingRight = '4px';
    rectText.innerHTML = '<b>Rectangle</b>';
    rectUI.appendChild(rectText);

    // Setup the click event listeners: simply set the map to
    // Chicago
    google.maps.event.addDomListener(controlUI, 'click', function() {
        map.setCenter(chicago)
    });

}

//INITIALIZE MAP
function initialize() {
    var mapOptions = {
        zoom: 12,
        disableDefaultUI: true,
        styles: [
            {featureType:'water', stylers:[{color:'#46bcec'}, {visibility:'on'}]},
            {featureType:'landscape', stylers:[{color:'#f2f2f2'}]},
            {featureType:'road',	stylers:[{saturation:-100},{lightness:45}]},
            {featureType:'road.highway',stylers:[{visibility:'simplified'}]},
            {featureType:'road.arterial',elementType:'labels.icon',stylers:[{visibility:'off'}]},
            {featureType:'administrative',elementType:'labels.text.fill',stylers:[{color:'#444444'}]},
            {featureType:'transit',	stylers:[{visibility:'off'}]},
            {featureType:'poi',stylers:[{visibility:'off'}]}]
    };
    map = new google.maps.Map(document.getElementById('map'),
        mapOptions);

    //Creates a new rectangle to be used.
    rectangle = new google.maps.Rectangle({
        strokeColor: '#4290FF',
        strokeOpacity: 0.6,
        strokeWeight: 2,
        fillOpacity: 0.0,
        clickable: false,
        map: map
    });

    //Right CLICK MENU
    //	create the ContextMenuOptions object
    var contextMenuOptions={};
    contextMenuOptions.classNames={menu:'context_menu', menuSeparator:'context_menu_separator'};

    //	create an array of ContextMenuItem objects
    var menuItems=[];
    menuItems.push({className:'context_menu_item', eventName:'shout_here', label:'Shout here'});
//            menuItems.push({className:'context_menu_item', eventName:'zoom_out_click', label:'Zoom out'});
    //	a menuItem with no properties will be rendered as a separator
//            menuItems.push({});
    menuItems.push({className:'context_menu_item', eventName:'center_map_click', label:'Center map here'});
    contextMenuOptions.menuItems=menuItems;

    //	create the ContextMenu object
    var contextMenu=new ContextMenu(map, contextMenuOptions);

    //	display the ContextMenu on a Map right click
    google.maps.event.addListener(map, 'rightclick', function(mouseEvent){
        showContextMenu(mouseEvent);

    });

    new LongPress(map, 1000);
    google.maps.event.addListener(map, 'longpress', function(event) {
        //showContextMenu(event);
        contextMenu.show(event.latLng);
    });

    function showContextMenu(mouseEvent){
        console.log("showcontext");
        contextMenu.show(mouseEvent.latLng);
    }
    google.maps.event.addListener(contextMenu, 'menu_item_selected', function(latLng, eventName){
        //	latLng is the position of the ContextMenu
        //	eventName is the eventName defined for the clicked ContextMenuItem in the ContextMenuOptions
        contextMenu.hide();
        switch(eventName){
            //If the user wants to post a shout.
            case 'shout_here':
                //shoutMarker.setPosition(latLng);
                //if(!shoutMarker.getMap()){
                //    shoutMarker.setMap(map);
                //}
                shoutHere(latLng.lat(),latLng.lng());
                break;
//                    case 'zoom_out_click':
//                        map.setZoom(map.getZoom()-1);
//                        break;
            case 'center_map_click':
                shoutMarker.setMap(null);
                break;
        }
    });


//Called when the user wants to shout through map right-click
    function shoutHere(lat,Lng) {
        var shout_modal= $('#shoutModal');
        shout_modal.attr('Lat',lat);
        shout_modal.attr('Lng',Lng);
        shout_modal.foundation('reveal', 'open');
    }

    google.maps.event.addListener(map,'bounds_changed',function(){
        try {
            currentBounds = map.getBounds();
            ne = currentBounds.getNorthEast();
            sw = currentBounds.getSouthWest();
        } catch (err){
            alert (err);
        }

    });

// Try HTML5 geolocation
    if(navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            var pos = new google.maps.LatLng(position.coords.latitude,
                position.coords.longitude);

//                    var infowindow = new google.maps.InfoWindow({
//                        map: map,
//                        position: pos,
//                        content: 'Location found using HTML5.'
//                    });

            map.setCenter(pos);
        }, function() {
            handleNoGeolocation(true);
        });
    } else {
        // Browser doesn't support Geolocation
        handleNoGeolocation(false);
    }

    var homeControlDiv = document.createElement('div');
    var homeControl = new HomeControl(homeControlDiv, map);

    homeControlDiv.index = 1;
    map.controls[google.maps.ControlPosition.TOP_LEFT].push(homeControlDiv);
}

function handleNoGeolocation(errorFlag) {
    if (errorFlag) {
        var content = 'Error: The Geolocation service failed.';
    } else {
        var content = 'Error: Your browser doesn\'t support geolocation.';
    }

    var options = {
        map: map,
        position: new google.maps.LatLng(60, 105),
        content: content
    };

    var infowindow = new google.maps.InfoWindow(options);
    map.setCenter(options.position);
}

//Called when the user clicks on the rectangle button
function setRectangle_onclick(){
    //rectangleView.setMap(null);
    var shout_area =$('#shout_area');
    var tempBounds = new google.maps.LatLngBounds(
        sw,
        ne
    );
    //alert(sw.lat()+ne);
    rectangle.setBounds(tempBounds);
    $.ajax('/wall/',{
        type: 'GET',
        data:{
            sw_lat: sw.lat(),
            sw_lng: sw.lng(),
            ne_lat: ne.lat(),
            ne_lng: ne.lng()
        },
        success: function(data){
            //showComments(shout_key,data);width:rem-calc(565);
            var wh = $(window).height()-45;
            shout_area.css("height", wh+"px")

            if(remCalc($(window).width())< 35.31){
                shout_area.css("width", "100vw")
            }
            shout_area.append($(data.shout_html)).html();
            shout_area.css("visibility", "visible");

            add_to_heatmap(data.shouts)
        },
        error: function( req, status, err ) {
            console.log( 'something went wrong', status, err );
        }
    });


}
function add_to_heatmap(json_points){
    var loc_array =[];
    $.each(json_points, function(i, shout) {
        loc_array.push(new google.maps.LatLng(shout.lat, shout.lng))
    });
    var pointArray = new google.maps.MVCArray(loc_array);

    heatmap = new google.maps.visualization.HeatmapLayer({
        data: pointArray
    });

    heatmap.setData(pointArray);
    heatmap.setMap(map);

}


function LongPress(map, length) {
    this.length_ = length;
    var me = this;
    me.map_ = map;
    me.timeoutId_ = null;
    google.maps.event.addListener(map, 'mousedown', function(e) {
        me.onMouseDown_(e);
    });
    google.maps.event.addListener(map, 'mouseup', function(e) {
        me.onMouseUp_(e);
    });
    google.maps.event.addListener(map, 'drag', function(e) {
        me.onMapDrag_(e);
    });
};
LongPress.prototype.onMouseUp_ = function(e) {
    clearTimeout(this.timeoutId_);
};
LongPress.prototype.onMouseDown_ = function(e) {
    clearTimeout(this.timeoutId_);
    var map = this.map_;
    var event = e;
    this.timeoutId_ = setTimeout(function() {
        google.maps.event.trigger(map, 'longpress', event);
    }, this.length_);
};
LongPress.prototype.onMapDrag_ = function(e) {
    clearTimeout(this.timeoutId_);

};

google.maps.event.addDomListener(window, 'load', initialize);

