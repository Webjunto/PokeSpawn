'use strict';

angular.module('tophemanDatavizApp')

.controller('MainCtrl', function($scope, persistance, displayState) {

  $scope.channelsDescription = persistance.getData().channelsDescription;
  $scope.data = persistance.getData();
  $scope.displayState = displayState;

  var newyork = new google.maps.LatLng(40.69847032728747, -73.9514422416687);

  var mapOptions = {
    center: newyork,
    zoom: 6,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };

  $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);

  $scope.map.set('styles', [
  {
    "featureType": "all",
    "elementType": "labels",
    "stylers": [
    {
      "visibility": "off"
    }
    ]
  }]);

  // begin code to drop a marker & create info window (this MUST be inside where the map loads: http://stackoverflow.com/questions/7058094/google-maps-api-cannot-read-property-e3-of-undefined) //
  //Wait until the map is loaded
  google.maps.event.addListenerOnce($scope.map, 'idle', function(){
    console.log("Google Maps Idle");
    var marker = new google.maps.Marker({
        map: $scope.map,
        animation: google.maps.Animation.DROP,
        position: newyork
    });

    var infoWindow = new google.maps.InfoWindow({
        content: "Here I am!"
    });
   
    google.maps.event.addListener(marker, 'click', function () {
        infoWindow.open($scope.map, marker);
    });      
   
  });
  
    // end code to get map running //
});