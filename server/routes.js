/**
 * Main application routes
 */

'use strict';

var errors = require('./components/errors');

// Dependencies
var mongoose        = require('mongoose');
var Tweet            = require('./model.js');

module.exports = function(app, socketManager) {

  // GET Routes for Database
  // --------------------------------------------------------
  // Retrieve records for all Tweets in the db

  // View Database by going to localhost:9000/tweets
  app.get('/tweets', function(req, res){
    console.log("Inside Tweets Route");
      // Uses Mongoose schema to run the search (empty conditions)
      var query = Tweet.find({});
      query.exec(function(err, tweets){
          if(err)
              res.send(err);

          // If no errors are found, it responds with a JSON of all tweets
          res.json(tweets);
      });
  });

  // Retrieves JSON records for all tweets who meet a certain set of query conditions
  app.post('/query', function(req, res){

    // Grab all of the query parameters from the body.
    var lat             = req.body.latitude;
    var long            = req.body.longitude;
    var distance        = req.body.distance;
    var pokemon         = req.body.pokemon;
    var minAge          = req.body.minAge;
    var maxAge          = req.body.maxAge;

    // Opens a generic Mongoose Query. Depending on the post body we will...
    var query = Tweet.find({});

    // ...include filter by Max Distance (converting miles to meters)
    if(distance){
      // Using MongoDB's geospatial querying features. (Note how coordinates are set [long, lat]
      query = query.where('coordinates').near({ 
        center: 
          {coordinates: [long,lat], type: 'Point'},
      // Converting meters to miles. Specifying spherical geometry (for globe)
          maxDistance: distance * 1609.34, spherical: true});
    }

    // ...include filter by Gender (all options)
    if(pokemon){
        query = query.where('keywords').equals(pokemon);
    }

    // ...include filter by Min Age
    if(minAge){
        query = query.where('created_at').gte(minAge);
    }

    // ...include filter by Max Age
    if(maxAge){
      var cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - maxAge);
      query = query.where('created_at').lte(cutoff);
    }

    query.limit(1000);

    // Execute Query and Return the Query Results
    query.exec(function(err, tweets){
      if(err){ 
        console.error(JSON.stringify(err));
        res.send(err); 
      }
      // If no errors, respond with a JSON of all tweets that meet the criteria
      res.json(tweets);
    });
  });

  // Returns the state of the socket and twitter connexions
  app.get('/api/state', function(req,res){
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(socketManager.getState()));
  });
  
  // All undefined asset or api routes should return a 404
  app.route('/:url(api|auth|components|app|bower_components|assets)/*')
   .get(errors[404]);

  // All other routes should redirect to the index.html
  app.route('/*')
    .get(function(req, res) {
      res.sendfile(app.get('appPath') + '/index.html');
    });

  
};
