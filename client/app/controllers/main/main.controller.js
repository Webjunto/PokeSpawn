'use strict';

angular.module('tophemanDatavizApp')

.controller('MainCtrl', function($scope, $http, $q, persistance, displayState) {

  $scope.channelsDescription = persistance.getData().channelsDescription;
  $scope.data = persistance.getData();
  $scope.displayState = displayState;

  $scope.$watchCollection('data', function(newData, oldData) {
    console.log("Data has changed!, data: " + JSON.stringify(newData.channels[0]));
    if (newData.channels[0].lastTweets[0]) {
      var tmpCoordinates = new google.maps.LatLng(newData.channels[0].lastTweets[0].coordinates[0], newData.channels[0].lastTweets[0].coordinates[1]);
      createMarker(newData.channels[0].lastTweets[0].keywords[0], tmpCoordinates);
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
    var getTweets = window.location + "tweets";

    $http.get(getTweets).then(function(response){ 
      for (var r in response.data) {
        var promise = new Promise(function(resolve, reject) {
          // do a thing, possibly async, then…
          var tmpCoordinates = new google.maps.LatLng(response.data[r].coordinates[0], response.data[r].coordinates[1]);
          if (createMarker(response.data[r].keywords[0], tmpCoordinates)) {
            resolve("Creating marker worked");
          }
          else {
            reject(Error("Creating marker didn't work!"));
          }
        });
      }
    });
  });

  function createMarker(pokemon, tmpCoordinates) {

    var pokemonIconUrl =  "assets/images/" + pokemon + ".png";

    isImage(pokemonIconUrl).then(function(result) {
      if (result) {
        // console.log("EXISTS: " + pokemonIconUrl);
      } else {
        // console.log("DOESNT EXIST: " + pokemonIconUrl);
        pokemonIconUrl = "assets/images/pokeball_marker.png";
      }

      // console.log("Creating " + pokemonIconUrl);
      var iconValidated = {
        url:  pokemonIconUrl,
        scaledSize: new google.maps.Size(25, 25), // scaled size
        origin: new google.maps.Point(0,0), // origin
        anchor: new google.maps.Point(0, 0) // anchor
      };

      var marker = new google.maps.Marker({
        map: $scope.map,
        animation: google.maps.Animation.DROP,
        position: tmpCoordinates,
        icon : iconValidated
      });

      google.maps.event.addListener(marker, 'click', function () {
        var infoWindow = new google.maps.InfoWindow({
          content: pokemon
        });
        infoWindow.open($scope.map, marker);
      }); 
    });
    return true;
  }

  function isImage(src) {

    var deferred = $q.defer();

    var image = new Image();
    image.onerror = function() {
        deferred.resolve(false);
    };
    image.onload = function() {
        deferred.resolve(true);
    };
    image.src = src;

    return deferred.promise;
  }
  // end code to get map running //
});