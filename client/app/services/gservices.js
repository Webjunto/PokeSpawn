'use strict';

angular.module('tophemanDatavizApp')
  .service('gservice', function($q) {
    //Instantiate Map Variable
    var Map;
    //Instantiate current Date for Marker
    var Today = new Date();

    var createMap = function (_centerOfMap, _zoomLevel) {
      //Initial Zoom Point
      var zoomPoint;
      var zoomLevel;
      if (_centerOfMap) {
        zoomPoint = _centerOfMap;
      } else {
        zoomPoint = new google.maps.LatLng(40.69847032728747, -73.9514422416687);
      }
      
      if (_zoomLevel) { 
        zoomLevel = _zoomLevel;
      } else {
        zoomLevel = 2;
      }
      var mapOptions = {
        center: zoomPoint,
        zoom: zoomLevel,
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

    var createMarker = function(tweet) {
      // console.error("TWEET: " + JSON.stringify(tweet));
      // Let's put this backwords to make up for Database
      var tmpCoordinates = new google.maps.LatLng(tweet.coordinates[1], tweet.coordinates[0]);
      var pokemonIconUrl =  "assets/images/" + tweet.keywords[0] + ".png";
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
          console.log("Tweet pic: " + tweet.media_url_https);
           // Create popup windows for each record
          var  contentString =
              // '<p><b>User</b>: <a href=\"www.twitter.com/' + tweet.screen_name + '\" > @' + tweet.screen_name + '</a>'
              '<p><b>User</b>: @' + tweet.screen_name +  
              '<br><b>Pokemon</b>: ' + tweet.keywords[0] +
              '<br><b>Posted</b>: ' + parseTwitterDate(tweet.created_at) +
              '<br><b>Text</b>: ' + tweet.text +
              '<br><b>Image</b>: <img src=\"' + tweet.profile_image_url + '\" style=\"height:42px;width:42px;\">' +
              '<br><b>Coordinates</b>:' + JSON.stringify(tweet.coordinates) +
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

    /*Parse Twitter Date
    Taken from http://stackoverflow.com/questions/6549223/javascript-code-to-display-twitter-created-at-as-xxxx-ago//
    */
    function parseTwitterDate(tdate) {
      var system_date = new Date(Date.parse(tdate));
      var user_date = new Date();
      if (K.ie) {
          system_date = Date.parse(tdate.replace(/( \+)/, ' UTC$1'))
      }
      var diff = Math.floor((user_date - system_date) / 1000);
      if (diff <= 1) {return "just now";}
      if (diff < 20) {return diff + " seconds ago";}
      if (diff < 40) {return "half a minute ago";}
      if (diff < 60) {return "less than a minute ago";}
      if (diff <= 90) {return "one minute ago";}
      if (diff <= 3540) {return Math.round(diff / 60) + " minutes ago";}
      if (diff <= 5400) {return "1 hour ago";}
      if (diff <= 86400) {return Math.round(diff / 3600) + " hours ago";}
      if (diff <= 129600) {return "1 day ago";}
      if (diff < 604800) {return Math.round(diff / 86400) + " days ago";}
      if (diff <= 777600) {return "1 week ago";}
      return "on " + system_date;
    }
    var K = function () {
      var a = navigator.userAgent;
      return {
          ie: a.match(/MSIE\s([^;]*)/)
      }
    }();
    /*End Parse Twitter date*/

    /* Return function for gservice.  Returns all functions for public use*/
    return {
      createMap: createMap,
      createMarker: createMarker,
      isImage: isImage
    };

  });
