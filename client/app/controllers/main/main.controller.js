'use strict';

angular.module('tophemanDatavizApp')

.controller('MainCtrl', function($scope, $http, $q, gservice, persistance, displayState) {

  $scope.channelsDescription = persistance.getData().channelsDescription;
  $scope.data = persistance.getData();
  $scope.displayState = displayState;

  //Initialize Map 
  $scope.map = gservice.createMap();

  $scope.$watchCollection('data', function(newData, oldData) {
    console.log("Data has changed!, data: " + JSON.stringify(newData.channels[0]));
    if (newData.channels[0].lastTweets[0]) {
      var tmpCoordinates = new google.maps.LatLng(newData.channels[0].lastTweets[0].coordinates[0], newData.channels[0].lastTweets[0].coordinates[1]);
      gservice.createMarker(newData.channels[0].lastTweets[0], tmpCoordinates);
    }
  });

  // begin code to drop a marker & create info window (this MUST be inside where the map loads: http://stackoverflow.com/questions/7058094/google-maps-api-cannot-read-property-e3-of-undefined) //
  //Wait until the map is loaded
  google.maps.event.addListenerOnce($scope.map, 'idle', function(){
    console.log("Google Maps Idle");
    var getTweets = window.location + "tweets";

    $http.get(getTweets).then(function(response){ 
      for (var r in response.data) {
        var promise = new Promise(function(resolve, reject) {
          // do a thing, possibly async, then…
          var tmpCoordinates = new google.maps.LatLng(response.data[r].coordinates[0], response.data[r].coordinates[1]);
          if (gservice.createMarker(response.data[r], tmpCoordinates)) {
            resolve("Creating marker worked");
          }
          else {
            reject(Error("Creating marker didn't work!"));
          }
        });
      }
    });
  });

  
});