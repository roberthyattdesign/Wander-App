


function initialize() {

  var script = document.createElement("script");
    script.type = "text/javascript";
    script.onload=function() {
      map = null;
      boxpolys = null;
      directions = null;
      routeBoxer = null;
      distance = null; // km
      service = null;
      gmarkers = [];
      infowindow = new google.maps.InfoWindow();
      mapOptions = {
        center: new google.maps.LatLng(40,-80.5),
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        zoom: 8
      };

      map = new google.maps.Map(document.getElementById("map-bkgd"), mapOptions);
      service = new google.maps.places.PlacesService(map);

      routeBoxer = new RouteBoxer();

      directionService = new google.maps.DirectionsService();
      directionsRenderer = new google.maps.DirectionsRenderer({ map: map }); 
    };
    document.getElementsByTagName("head")[0].appendChild(script);
    script.src = 'http://google-maps-utility-library-v3.googlecode.com/svn/trunk/routeboxer/src/RouteBoxer.js';
  // <script src="" type="text/javascript"></script>
  // Default the map view to the continental U.S.
       
}


$('.js-submit').on('click', function() {
  route();
});

function route() {
  // Clear any previous route boxes from the map
  clearBoxes();

  // Convert the distance to box around the route from miles to km
  distance = 0.9 * 1.609344;

  var request = {
    origin: $(".js-start").val(),
    destination: $(".js-end").val(),
    travelMode: google.maps.DirectionsTravelMode.DRIVING
  }

  // Make the directions request
  directionService.route(request, function(result, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      directionsRenderer.setDirections(result);

      // Box around the overview path of the first route
      var path = result.routes[0].overview_path;
      var boxes = routeBoxer.box(path, distance);
      // alert(boxes.length);
      drawBoxes(boxes);
      findPlaces(boxes,0);
    } else {
      alert("Directions query failed: " + status);
    }
  });
}

// Draw the array of boxes as polylines on the map
function drawBoxes(boxes) {
  boxpolys = new Array(boxes.length);
  for (var i = 0; i < boxes.length; i++) {
    boxpolys[i] = new google.maps.Rectangle({
      bounds: boxes[i],
      fillOpacity: 0,
      strokeOpacity: 1.0,
      strokeColor: '#000000',
      strokeWeight: 1,
      map: map
    });
  }
}


function findPlaces(boxes,searchIndex) {
   var request = {
       bounds: boxes[searchIndex],
       types: ["stores"]
   };
   // alert(request.bounds);
   service.radarSearch(request, function (results, status) {
   if (status != google.maps.places.PlacesServiceStatus.OK) {
     alert("Request["+searchIndex+"] failed: "+status);
     return;
   }
   // alert(results.length);
   // document.getElementById('side_bar').innerHTML += "bounds["+searchIndex+"] returns "+results.length+" results<br>"
   for (var i = 0, result; result = results[i]; i++) {
     var marker = createMarker(result);
   }
   searchIndex++;
   if (searchIndex < boxes.length) 
     findPlaces(boxes,searchIndex);
   });
}

// Clear boxes currently on the map
function clearBoxes() {
  if (boxpolys != null) {
    for (var i = 0; i < boxpolys.length; i++) {
      boxpolys[i].setMap(null);
    }
  }
  boxpolys = null;
}

function createMarker(place){
    var placeLoc=place.geometry.location;
    if (place.icon) {
      var image = new google.maps.MarkerImage(
                place.icon, new google.maps.Size(71, 71),
                new google.maps.Point(0, 0), new google.maps.Point(17, 34),
                new google.maps.Size(25, 25));
     } else var image = null;

    var marker=new google.maps.Marker({
        map:map,
        icon: image,
        position:place.geometry.location
    });
    var request =  {
          reference: place.reference
    };
    google.maps.event.addListener(marker,'click',function(){
        service.getDetails(request, function(place, status) {
          if (status == google.maps.places.PlacesServiceStatus.OK) {
            var contentStr = '<h5>'+place.name+'</h5><p>'+place.formatted_address;
            if (!!place.formatted_phone_number) contentStr += '<br>'+place.formatted_phone_number;
            if (!!place.website) contentStr += '<br><a target="_blank" href="'+place.website+'">'+place.website+'</a>';
            contentStr += '<br>'+place.types+'</p>';
            infowindow.setContent(contentStr);
            infowindow.open(map,marker);
          } else { 
            var contentStr = "<h5>No Result, status="+status+"</h5>";
            infowindow.setContent(contentStr);
            infowindow.open(map,marker);
          }
        });

    });
    gmarkers.push(marker);
    //var side_bar_html = "<a href='javascript:google.maps.event.trigger(gmarkers["+parseInt(gmarkers.length-1)+"],\"click\");'>"+place.name+"</a><br>";
    //document.getElementById('side_bar').innerHTML += side_bar_html;
}

$( window ).load(function(){
  initialize();
})

