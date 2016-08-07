'use strict';

angular.module('tophemanDatavizApp')
  .service('gservice', function($q) {
    //Instantiate Map Variable
    var Map;
    //Instantiate current Date for Marker
    var Today = new Date();

    var markers = [];

    var createMap = function (_centerOfMap, _zoomLevel) {
      //Initial Zoom Point
      var zoomPoint;
      var zoomLevel;
      if (_centerOfMap) {
        zoomPoint = _centerOfMap;
      } else {
        zoomPoint = new google.maps.LatLng(42.796534304623066, -96.2756609916687);
      }
      
      if (_zoomLevel) { 
        zoomLevel = _zoomLevel;
      } else {
        zoomLevel = 4;
      }
      var mapOptions = {
        center: zoomPoint,
        zoom: zoomLevel,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        minZoom: 2
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
      isImage: isImage,
    };

  });
