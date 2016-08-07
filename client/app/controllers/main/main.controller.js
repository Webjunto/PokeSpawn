'use strict';

angular.module('tophemanDatavizApp')

.controller('MainCtrl', function($scope, $http, $q, gservice, persistance, displayState) {

  $scope.channelsDescription = persistance.getData().channelsDescription;
  $scope.data = persistance.getData();
  $scope.displayState = displayState;
  $scope.queryCount;
  $scope.pokemonArray = [];  //store an array of Pokemon from each request
  $scope.markersArray = [];
  $scope.map;
  $scope.formData = {};
  $scope.queryDistance = 1500;
  var makeItRainBool = false;
  var queryBody = {};
  var geocoder = new google.maps.Geocoder();
  $scope.pokemonCount;
  $http.get('/tweets')
      .success(function(resultCount)
      {
        // Count the number of records retrieved for the panel-footer
        $scope.pokemonCount = resultCount;
        console.log("Query results retrieved: " + $scope.pokemonCount);
      })
      .error(function(queryResults){
          console.error('Error in Query' + queryResults);
      })

  $scope.$watchCollection('data', function(newData, oldData) {
    console.log("Data has changed!, data: " + JSON.stringify(newData.channels[0]));
    if (newData.channels[0].lastTweets[0]) {
      gservice.createMarker(newData.channels[0].lastTweets[0]);
    }
  });


  var i = 0;

  var promiseLoop = function() {
    if (i > $scope.pokemonArray.length) {
      return;
    }

    i +=1;

    setTimeout( function () {
      var promise = new Promise(function(resolve, reject) {
      if (createMarker($scope.pokemonArray[i])) {
        resolve("Creating marker worked");
        console.log("Resolved");
      }
      else {
        reject(Error("Creating marker didn't work!"));
      }
      });
      promiseLoop();
    }, 0);
  }


  var clearMarkers = function (specificQueryBool) {
    console.log("Clearing markers, specificQueryBool = " + specificQueryBool);
    if ($scope.markersArray.length >= 3000 || specificQueryBool) {
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
      clearMarkers();
      $scope.queryTweets();
    });

    // google.maps.event.addListener($scope.map, 'dragend', function(){
    //   console.log("Map Dragged");
    //   $scope.queryTweets();
    // });

  }
  //Initialize Map 
  $scope.map = gservice.createMap();
  addEventListeners();

  $scope.specificQuery = function (specificQueryBool) {
    console.log("specificQuery + " + specificQueryBool);
    clearMarkers(specificQueryBool);
    $scope.queryTweets();
  }

  $scope.searchByAddress = function () {
    console.log("Searching by Address + " + $scope.formData.address);
    clearMarkers(true);

    if ($scope.formData.address && geocoder) {
      geocoder.geocode( { 'address': $scope.formData.address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          if (status != google.maps.GeocoderStatus.ZERO_RESULTS) {
            $scope.queryTweets(results[0].geometry.location);
            $scope.map.setZoom(10);
            $scope.map.setCenter(results[0].geometry.location);
          }
        }
      })
    }
    $scope.queryTweets();
  }
  
  // Take query parameters and incorporate into a JSON queryBody
  $scope.queryTweets = function(addressCoordinates){
    console.log("Quering for Tweets");
    /* Get our current map state so we can return here upon successful query */
    var tmpCenter = $scope.map.getCenter();;
    var tmpZoom = $scope.map.getZoom();
    if (addressCoordinates){
      console.log("Querying by Address Coordinates");
      $scope.queryDistance = 25;
    }
    else {
      $scope.queryDistance = 1000;
    }
    console.log("Map Center:" + JSON.stringify(tmpCenter) + ", Zoom = " + tmpZoom + " , Distance = " + $scope.queryDistance);

    // Assemble Query Body
    queryBody = {
      pokemon: $scope.formData.pokemon,
      minAge: $scope.formData.minAge,
      maxAge: $scope.formData.maxAge,
      latitude: parseFloat(tmpCenter.lat()),
      longitude: parseFloat(tmpCenter.lng()),
      distance: parseFloat($scope.queryDistance)
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

        // Push new results (only) to pokemonArray[]
        for (var r in queryResults) {
          if ($scope.pokemonArray.indexOf(queryResults[r]) == -1) {
            //console.log("Pushing to array #" + r);
            $scope.pokemonArray.push(queryResults[r]);
          }
          else {
            console.log("Duplicate found, skipping.");
          }
        }

        promiseLoop();

      })
      .error(function(queryResults){
          console.error('Error in Query' + queryResults);
      })
    };

  $scope.makeItRainToggle = function () {
    if (makeItRainBool) {
      makeItRainBool = false;
    } else {
      makeItRainBool = true;
    }
  }

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

    
    return true;
  };
});