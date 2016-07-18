/**
 * Express configuration
 */

'use strict';

var express = require('express');
var favicon = require('static-favicon');
var morgan = require('morgan');
var mongoose = require('mongoose');
var compression = require('compression');
var bodyParser = require('body-parser');
var methodOverride = require('method-override');
var cookieParser = require('cookie-parser');
var errorHandler = require('errorhandler');
var path = require('path');
var config = require('./environment');

module.exports = function(app) {
  var env = app.get('env');

  app.set('views', config.root + '/server/views');
  app.engine('html', require('ejs').renderFile);
  app.set('view engine', 'html');
  app.use(compression());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(cookieParser());

  if ('production' === env) {
    console.log("****Production was set****");
    app.use(favicon(path.join(config.root, 'public', 'favicon.ico')));
    app.use(express.static(path.join(config.root, 'public')));
    app.set('appPath', config.root + '/public');
    app.use(morgan('dev'));

    //MongoDBConnection
    // Old server
    // mongoose.connect("mongodb://heroku_sbc5jf99:d7f9e1atop1uglohcm43ro435p@ds023565-a0.mlab.com:23565,ds023565-a1.mlab.com:23565/heroku_sbc5jf99?replicaSet=rs-ds023565");
    // Correct server
    mongoose.connect("mongodb://jedi-user:xfg2d56xs@ds023585-a0.mlab.com:23585,ds023585-a1.mlab.com:23585/heroku_x4rm9c3c?replicaSet=rs-ds023585");    
  }

  if ('development' === env || 'development-online' === env || 'test' === env) {
    // Sets the connection to MongoDB
    // mongoose.connect("mongodb://localhost/PokemonSpawnDev");
    //mongoose.connect("mongodb://heroku_sbc5jf99:d7f9e1atop1uglohcm43ro435p@ds023565-a0.mlab.com:23565,ds023565-a1.mlab.com:23565/heroku_sbc5jf99?replicaSet=rs-ds023565");

    mongoose.connect("mongodb://jedi-user:xfg2d56xs@ds023585-a0.mlab.com:23585,ds023585-a1.mlab.com:23585/heroku_x4rm9c3c?replicaSet=rs-ds023585");
    app.use(require('connect-livereload')());
    app.use(express.static(path.join(config.root, '.tmp')));
    app.use(express.static(path.join(config.root, 'client')));
    app.set('appPath', 'client');
    app.use(morgan('dev'));
    app.use(errorHandler()); // Error handler - has to be last
  }
};