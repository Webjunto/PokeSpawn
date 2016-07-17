'use strict';

angular.module('tophemanDatavizApp')
  .service('gservice', function($q) {
    //Instantiate Map Variable
    var Map;

    var createMap = function () {
      //Initial Zoom Point
      var newyork = new google.maps.LatLng(40.69847032728747, -73.9514422416687);

      var mapOptions = {
        center: newyork,
        zoom: 2,
        mapTypeId: google.maps.MapTypeId.ROADMAP
      };

      Map = new google.maps.Map(document.getElementById("map"), mapOptions);

      Map.set('styles', [{
        "featureType": "all",
        "elementType": "labels",
        "stylers": [{
          "visibility": "off"
        }]
      }]);

      return Map;
    }

    var createMarker = function(pokemon, tmpCoordinates) {
      var pokemonIconUrl =  "assets/images/" + pokemon + ".png";
      isImage(pokemonIconUrl).then(function(result) {
        if (result) { /*console.log("EXISTS: " + pokemonIconUrl);*/} 
        else { /*console.log("DOESNT EXIST: " + pokemonIconUrl);*/
          pokemonIconUrl = "assets/images/pokeball_marker.png";
        }

        var iconValidated = {
          url:  pokemonIconUrl,
          scaledSize: new google.maps.Size(25, 25), // scaled size
          origin: new google.maps.Point(0,0), // origin
          anchor: new google.maps.Point(0, 0) // anchor
        };

        var marker = new google.maps.Marker({
          map: Map,
          animation: google.maps.Animation.DROP,
          position: tmpCoordinates,
          icon : iconValidated
        });

        google.maps.event.addListener(marker, 'click', function () {
          var infoWindow = new google.maps.InfoWindow({
            content: pokemon
          });
          infoWindow.open(Map, marker);
        }); 
      });
      return true;
    };

    // Detects whether or not an image exists on our server (live)
    var isImage = function(src) {

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
    };

    /* Return function for gservice.  Returns all functions for public use*/
    return {
      createMap: createMap,
      createMarker: createMarker,
      isImage: isImage
    };

  });
