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
