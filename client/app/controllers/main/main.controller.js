'use strict';

angular.module('tophemanDatavizApp')

.controller('MainCtrl', function($scope, $http, $q, gservice, persistance, displayState) {

  $scope.channelsDescription = persistance.getData().channelsDescription;
  $scope.data = persistance.getData();
  $scope.displayState = displayState;
  $scope.queryCount;

  $scope.formData = {};
  var queryBody = {};

  $scope.$watchCollection('data', function(newData, oldData) {
    console.log("Data has changed!, data: " + JSON.stringify(newData.channels[0]));
    if (newData.channels[0].lastTweets[0]) {
      gservice.createMarker(newData.channels[0].lastTweets[0]);
    }
  });

  var addEventListeners = function () {
    console.log("Adding map event listeners");
    // begin code to drop a marker & create info window (this MUST be inside where the map loads: http://stackoverflow.com/questions/7058094/google-maps-api-cannot-read-property-e3-of-undefined) //
    //Wait until the map is loaded
   google.maps.event.addListenerOnce($scope.map, 'idle', function(){
      $scope.queryTweets();
    });

    google.maps.event.addListener($scope.map, 'zoom_changed', function() {
      console.log("zoom changed!");
      // gservice.reloadMarkers();
      $scope.queryTweets();
    });
  }
  //Initialize Map 
  $scope.map = gservice.createMap();
  addEventListeners();
  
  // Take query parameters and incorporate into a JSON queryBody
  $scope.queryTweets = function(zoomChange){
    console.log("Quering for Tweets");
    /* Get our current map state so we can return here upon successful query */
    var tmpCenter = $scope.map.getCenter();
    var tmpZoom = $scope.map.getZoom();
    console.log("Map Center:" + JSON.stringify(tmpCenter) + ", Zoom = " + tmpZoom + " , Distance = " + $scope.formData.distance);

    if (!$scope.formData.distance) {
      $scope.formData.distance = 1000;
    }
    
    // Assemble Query Body
    queryBody = {
      pokemon: $scope.formData.pokemon,
      minAge: $scope.formData.minAge,
      maxAge: $scope.formData.maxAge,
      latitude: parseFloat(tmpCenter.lat()),
      longitude: parseFloat(tmpCenter.lng()),
      distance: parseFloat($scope.formData.distance)
    };

    if (queryBody.pokemon) {
      queryBody.pokemon = queryBody.pokemon.toLowerCase()
    }

    console.log("Query = " + JSON.stringify(queryBody));
    // Post the queryBody to the /query POST route to retrieve the filtered results
    $http.post('/query', queryBody)
      .success(function(queryResults)
      {
        // Count the number of records retrieved for the panel-footer
        $scope.queryCount = queryResults.length;
        console.log("Query results retrieved: " + $scope.queryCount);

        for (var r in queryResults) {
        var promise = new Promise(function(resolve, reject) {
          if (gservice.createMarker(queryResults[r])) {
            resolve("Creating marker worked");
          }
          else {
            reject(Error("Creating marker didn't work!"));
          }
        });
        }
      })
      .error(function(queryResults){
          console.error('Error in Query' + queryResults);
      })
    };
});