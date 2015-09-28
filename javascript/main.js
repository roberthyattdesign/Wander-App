var GoogleAPIs = {};

GoogleAPIs.setKey = function setKey( key ) {
	this.key = key;
}

GoogleAPIs._isKeySet = function _isKeySet() {
	if ( typeof this.key === "undefined" ) {
		throw new Error('key is not set!');
	}
}

GoogleAPIs._getGeoCodeBase = function _getGeoCodeBase() {
	return 'https://maps.googleapis.com/maps/api/geocode/json';
}

GoogleAPIs._getProps = function _getProps( propertyObject ) {
	return $.extend({}, {
		key: this.key
	}, propertyObject);
}

GoogleAPIs.geoCode = function geoCode( address ) {
	GoogleAPIs._isKeySet();


	return $.get(this._getGeoCodeBase(), this._getProps({
		address: address
	}));
}

GoogleAPIs.onAll = function onAll( apiRequests ) {
	return $.when.apply( $, apiRequests );
}

GoogleAPIs.loadScript = function loadScript( src ) {
  	var d = $.Deferred();

    var script = document.createElement("script");
    script.type = "text/javascript";
    script.onload=function() {
    	d.resolve();
    };
    document.getElementsByTagName("head")[0].appendChild(script);
    script.src = src;

    return d.promise();
}

GoogleAPIs._computeCenter = function _computeCenter( start, end ) {
	return {
		lat: ( start.lat + end.lat ) / 2,
		lng: ( start.lng + end.lng ) / 2
	}
}

GoogleAPIs._getMapProps = function _getMapProps( propertyObject ) {
	if ( propertyObject.center ) {
		propertyObject.center = this._computeCenter( propertyObject.center[ 0 ], propertyObject.center[ 1 ] );
	}
	else {
		throw new Error( 'Center not given!' );
	}

	return $.extend({}, {
		mapTypeId: google.maps.MapTypeId.ROADMAP
	}, propertyObject);
}

GoogleAPIs.searchPlace = function searchPlace( map, reqObj ) {
	var d = $.Deferred();

	var request = reqObj;

	var service = new google.maps.places.PlacesService( map );
    service.nearbySearch(request, function(results, status) {
    	if (status == google.maps.places.PlacesServiceStatus.OK) {
    		d.resolve( results, map );
    	}
    	else {
    		d.reject('No results');
    	}
    });

    return d.promise();
}

GoogleAPIs.initMap = function initMap() {
	this.isMapCodeLoaded = true;
}

GoogleAPIs.drawMap = function drawMap( mapOptions, mapEl ) {
	return new google.maps.Map( mapEl, this._getMapProps( mapOptions ) );
}

GoogleAPIs.getMarker = function getMarker( latLng, map ) {
	return new google.maps.Marker({
		position: new google.maps.LatLng(latLng.lat, latLng.lng),
		map: map,
		animation: google.maps.Animation.DROP
	});
}

GoogleAPIs.setKey('AIzaSyADiBgS-30DiK0lJjdLbhaUlit6o6OqgQc');
// AIzaSyA7Yv-YRobudtv50Mihfz6Yv9HeOw24WTU
GoogleAPIs.
	loadScript('http://maps.googleapis.com/maps/api/js?v=3&sensor=false&callback=GoogleAPIs.initMap&libraries=places');
//http://jsfiddle.net/doktormolle/7cu2f/

function toggleIcon(){
	var $icon = $( this ),
		imgSrc = $icon.attr("src"),
		imgState = changeState(imgSrc),
		newImageState;

	$icon.removeClass('on');

	if (imgState === "off") {
		newImageState = "on";
		$icon.addClass('on');
	}
	else {
		newImageState = "off";
		$icon.removeClass('on');
	}

	$icon.attr("src", imgSrc.replace( imgState, newImageState ) );

}

function changeState( imgSrc ){
	var findState = imgSrc.split("/"),
		lastItem = findState.pop(),
		offOrOn = lastItem.split("-");
		state = offOrOn.shift();

	return state;
}

function getLatLng( obj ) {
	if ( obj[ 0 ].results.length === 0 ) {
		throw new Error('NO RESULTS');
	}
	return obj[ 0 ].results[ 0 ].geometry.location;
}


function submitSearch(){
	// find value of START and DESTINATION
	var start = $(".js-start").val(),
		end = $(".js-end").val();

	console.log( start, end);
	// get all "on" categories

	var findOns = $.map($(".js-icon.on"), function( currentEl, currIndex ){
		var $currentEl = $( currentEl );
		
		return $currentEl.attr('data-type');
	});
	// console.log(findOns);

	GoogleAPIs.onAll([ 
		GoogleAPIs.geoCode( start ), 
		GoogleAPIs.geoCode( end ) 
	]).then(function( startData, endData ){
		var startLatLng, endLatLng;

		try {
			startLatLng = getLatLng( startData );
		} catch(e) {
			$(".js-start").css('color', 'red')
		}

		try {
			endLatLng = getLatLng( endData );
		} catch(e) {
			$(".js-end").css('color', 'red')
		}

		if ( typeof startLatLng === "undefined" || typeof endLatLng === "undefined" ) {
			return;
		}

		var center = {
			lat:  ( startLatLng.lat + endLatLng.lat ) / 2,
			lng:  ( startLatLng.lng + endLatLng.lng ) / 2
		};

		var currMap = GoogleAPIs.drawMap({
 			zoom: 12,
            center: [startLatLng, endLatLng]
		}, $('.map-bkgd')[ 0 ] );


		var startMarker = GoogleAPIs.getMarker(startLatLng, currMap );
		var endMarker = GoogleAPIs.getMarker( endLatLng, currMap );

		
		var endMarker = new google.maps.Marker({
			position: new google.maps.LatLng(endLatLng.lat, endLatLng.lng),
			map: currMap
		});
		// load map

		return GoogleAPIs.searchPlace( currMap, {
			// bounds: new google.maps.LatLngBounds(
			// 	new google.maps.LatLng( startLatLng.lat, startLatLng.lng ),
			// 	new google.maps.LatLng( endLatLng.lat, endLatLng.lng )
			// ),
			location: new google.maps.LatLng( endLatLng.lat, endLatLng.lng ),
			radius: 5000
			// types: ['store']
		});
	})
	.then(function(results, map) {
		console.log( results );

		// GoogleAPIs.getMarker(startLatLng, currMap )

		for( var i = 0; i < results.length; i++ ) {
			var currentResult = results[ i ];
			
			GoogleAPIs.getMarker({
				lat: currentResult.geometry.location.G,
				lng: currentResult.geometry.location.K
			}, map );
		}
	});
	// load pins
}

$(".category-icons .js-icon").on('click', toggleIcon);
$(".js-submit").on("click", submitSearch);










