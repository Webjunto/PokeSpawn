'use strict';

angular.module('tophemanDatavizApp')

.controller('MainCtrl', function($scope, $http, $q, gservice, persistance, displayState) {

  $scope.channelsDescription = persistance.getData().channelsDescription;
  $scope.data = persistance.getData();
  $scope.displayState = displayState;
  $scope.queryCount;
  $scope.markersArray = [];
  $scope.map;
  $scope.formData = {};
  var queryBody = {};

  $scope.$watchCollection('data', function(newData, oldData) {
    console.log("Data has changed!, data: " + JSON.stringify(newData.channels[0]));
    if (newData.channels[0].lastTweets[0]) {
      gservice.createMarker(newData.channels[0].lastTweets[0]);
    }
  });

  var clearMarkers = function () {
    if ($scope.markersArray.length >= 3000) {
      console.log("Clearing out array");
      for(var i=0; i<$scope.markersArray.length; i++){
        if ($scope.markersArray[i].getMap() != null) $scope.markersArray[i].setMap(null);
        else $scope.markersArray[i].setMap($scope.map);
      }
      $scope.markersArray = [];
    }
  }
  var addEventListeners = function () {
    console.log("Adding map event listeners");
    // begin code to drop a marker & create info window (this MUST be inside where the map loads: http://stackoverflow.com/questions/7058094/google-maps-api-cannot-read-property-e3-of-undefined) //
    //Wait until the map is loaded
    google.maps.event.addListenerOnce($scope.map, 'idle', function(){
      $scope.queryTweets();
    });

    google.maps.event.addListener($scope.map, 'zoom_changed', function() {
      console.log("zoom changed!");
      for(var i=0; i<$scope.markersArray.length; i++){
        if ($scope.markersArray[i].getMap() != null) $scope.markersArray[i].setMap(null);
        else $scope.markersArray[i].setMap($scope.map);
      }
      
      $scope.queryTweets();
    });

    google.maps.event.addListener($scope.map, 'dragend', function(){
      console.log("Map Dragged");
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
          if (createMarker(queryResults[r])) {
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

  var createMarker = function(tweet) {
    var marker;
    // Let's put this backwords to make up for MongoDB Database requirements
    var tmpCoordinates = new google.maps.LatLng(tweet.coordinates[1], tweet.coordinates[0]);
    var pokemonIconUrl =  "assets/images/" + tweet.keywords[0] + ".png";
    gservice.isImage(pokemonIconUrl).then(function(result) {
      if (result) { /*console.log("EXISTS: " + pokemonIconUrl);*/} 
      else { pokemonIconUrl = "assets/images/pokeball_marker.png"; }

      var iconValidated = {
        url:  pokemonIconUrl,
        scaledSize: new google.maps.Size(48, 48), // scaled size
        origin: new google.maps.Point(0,0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
      };

      marker = new google.maps.Marker({
        map: $scope.map,
        animation: google.maps.Animation.DROP,
        position: tmpCoordinates,
        icon : iconValidated
      });

      $scope.markersArray.push(marker);

      google.maps.event.addListener(marker, 'click', function () {
        console.log("Tweet pic: " + tweet.media_url_https);
         // Create popup windows for each record
        var  contentString =
            '<p><b>User</b>: @' + tweet.screen_name +  
            '<br><b>Pokemon</b>: ' + tweet.keywords[0] +
            '<br><b>Posted</b>: ' + parseTwitterDate(tweet.created_at) +
            '<br><b>Text</b>: ' + tweet.text +
            '<br><b>Image</b>: <img src=\"' + tweet.profile_image_url + '\" style=\"height:42px;width:42px;\">' +
            '<p><b>Twitter Post</b>: <a href=\"http://twitter.com/' + tweet.screen_name + '\" > @' + tweet.screen_name + '</a>' +
            '</p>';
        var infoWindow = new google.maps.InfoWindow({
          content: contentString,
          maxWidth: 320
        });
        infoWindow.open(Map, marker);
      }); 
    });

    
    return true;
  };
});