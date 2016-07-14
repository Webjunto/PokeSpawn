'use strict';

angular.module('tophemanDatavizApp')

.controller('MainCtrl', function($scope, $http, persistance, displayState) {

  $scope.channelsDescription = persistance.getData().channelsDescription;
  $scope.data = persistance.getData();
  $scope.displayState = displayState;

  $scope.$watchCollection('data', function(newData, oldData) {
    console.log("Data has changed!, data: " + JSON.stringify(newData.channels[2]));
    if (newData.channels[2].lastTweets[0]) {
      var lat = newData.channels[2].lastTweets[0].coordinates[0];
      var lon = newData.channels[2].lastTweets[0].coordinates[1];
      var tmpCoordinates = new google.maps.LatLng(lat, lon);
      // $scope.dataCount = newNames.length;
      var marker = new google.maps.Marker({
        map: $scope.map,
        animation: google.maps.Animation.DROP,
        position: tmpCoordinates
      });
    }
  });

  var newyork = new google.maps.LatLng(40.69847032728747, -73.9514422416687);

  var mapOptions = {
    center: newyork,
    zoom: 1,
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

    var getURL = window.location + "tweets";
    console.log("GET URL = " + getURL);
    $http.get(getURL) .then(function(response){ 
      
      for (var r in response.data) {
        // console.log("*******" + JSON.stringify(response.data[r]));

        var lat = response.data[r].coordinates[0];
        var lon = response.data[r].coordinates[1];
        var tmpCoordinates = new google.maps.LatLng(lat, lon);

        var marker = new google.maps.Marker({
          map: $scope.map,
          animation: google.maps.Animation.DROP,
          position: tmpCoordinates
        });

        // var infoWindow = new google.maps.InfoWindow({
        //   content: response.data[r].keywords[0]
        // });
  
        // google.maps.event.addListener(marker, 'click', function () {
        //     infoWindow.open($scope.map, marker);
        // }); 
      }
    });
  });
  // end code to get map running //
});