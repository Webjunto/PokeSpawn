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
      gservice.createMarker(newData.channels[0].lastTweets[0]);
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
          if (gservice.createMarker(response.data[r])) {
            resolve("Creating marker worked");
          }
          else {
            reject(Error("Creating marker didn't work!"));
          }
        });
      }
    });
  });

  /* Query Controlls */

  // Initializes Variables
  // ----------------------------------------------------------------------------
  $scope.formData = {};
  var queryBody = {};

  // Functions
  // ----------------------------------------------------------------------------

  // Get User's actual coordinates based on HTML5 at window load
  // geolocation.getLocation().then(function(data){
  //   coords = {lat:data.coords.latitude, long:data.coords.longitude};
  //   // Set the latitude and longitude equal to the HTML5 coordinates
  //   $scope.formData.longitude = parseFloat(coords.long).toFixed(3);
  //   $scope.formData.latitude = parseFloat(coords.lat).toFixed(3);
  // });

  // Get coordinates based on mouse click. When a click event is detected....
  // $rootScope.$on("clicked", function(){
  //   // Run the gservice functions associated with identifying coordinates
  //   $scope.$apply(function(){
  //       $scope.formData.latitude = parseFloat(gservice.clickLat).toFixed(3);
  //       $scope.formData.longitude = parseFloat(gservice.clickLong).toFixed(3);
  //   });
  // });

  // Take query parameters and incorporate into a JSON queryBody
  $scope.queryTweets = function(){
    /* Get our current map state so we can return here upon successful query */
    var tmpCenter = $scope.map.getCenter();
    var tmpZoom = $scope.map.getZoom();
    console.log("MAP CENTER: " + JSON.stringify(tmpCenter) + " and Zoom = " + tmpZoom);
    console.log("Lat = " + tmpCenter.lat());
    
    // Assemble Query Body
    queryBody = {
      pokemon: $scope.formData.pokemon,
      minAge: $scope.formData.minAge,
      maxAge: $scope.formData.maxAge,
      latitude: parseFloat(tmpCenter.lat()),
      longitude: parseFloat(tmpCenter.lng()),
      distance: parseFloat($scope.formData.distance) //100 miles default
    };

    if (queryBody.pokemon) {
      queryBody.pokemon = queryBody.pokemon.toLowerCase()
    }

    console.log("Query = " + JSON.stringify(queryBody));
    // Post the queryBody to the /query POST route to retrieve the filtered results
    $http.post('/query', queryBody)

      // Store the filtered results in queryResults
      .success(function(queryResults)
      {
        // Query Body and Result Logging
        console.log("QueryBody:");
        console.log(queryBody);
        // Count the number of records retrieved for the panel-footer
        $scope.queryCount = queryResults.length;
        console.log("Query count = " + $scope.queryCount);
  
        $scope.map = gservice.createMap(tmpCenter, tmpZoom);
        /* End Reset the Map*/ 

        google.maps.event.addListenerOnce($scope.map, 'idle', function(){
          for (var r in queryResults) {
            var promise = new Promise(function(resolve, reject) {
              // console.log("...");
              // console.log(JSON.stringify(queryResults[r]));
              // console.log("...");
              if (gservice.createMarker(queryResults[r])) {
                resolve("Creating marker worked");
              }
              else {
                reject(Error("Creating marker didn't work!"));
              }
            });
          }
        });
      })
      .error(function(queryResults){
          console.error('Error in Query' + queryResults);
      })
    };


    /* End Query Controls */
});