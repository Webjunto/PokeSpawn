var socketMaxAge = require('../../config/environment').socketMaxAge;
var socketMaxAgeAlertBefore = require('../../config/environment').socketMaxAgeAlertBefore;
var cleanSocketsDelay = require('../../config/environment').cleanSocketsDelay;

// Dependencies
var mongoose        = require('mongoose');
var Tweet            = require('../../model.js');

if(socketMaxAgeAlertBefore > socketMaxAge){
  throw new Error("socketMaxAgeAlertBefore > socketMaxAge - must be lesser than. socketMaxAgeAlertBefore : "+socketMaxAgeAlertBefore+", socketMaxAge : "+socketMaxAge);
}

var SocketsManager = function(io, twitterStreamManager){
  
  var STATE_DISCONNECTED = 'disconnected';
  var STATE_CONNECTING = 'connecting';
  var STATE_CONNECTED = 'connected';

  var sockets = {};
  var twitterStreamRunning = false;//if true a stream to twitter is either connected or connecting
  var launchStreamRunning = false;//if true the launching routine is running (not to launch it it parallel)
  var cleanSocketsTimer = null;
  var twitterState = STATE_DISCONNECTED;
  
  //handle basic socket connection / disconnection
  io.on('connection',function(socket){
    //if the twitter stream was stopped but the thread not killed, reopen a stream if someone reconnects via websockets
    if(twitterStreamRunning === false && launchStreamRunning === false){
      launchStream();
    }
    console.log('>connection from browser to socket',socket.id+' '+(new Date()));
    sockets[socket.id] = {
      "time" : (new Date()).getTime(),
      "socket" : socket
    };
    //if no cleanning sockets routine is runnng - launch one
    if(cleanSocketsTimer === null){
      cleanSockets();
    }
    socket.emit('connected',{
      channelsDescription : twitterStreamManager.getDescriptionChannels(),
      twitterState : twitterState,
      socketMaxAge : socketMaxAge,
      socketMaxAgeAlertBefore : socketMaxAgeAlertBefore
    });
    socket.on('disconnect',function(){
      delete sockets[socket.id];
      console.log('>sockets','disconnect',socket.id,Object.keys(sockets).length+' sockets still opened'+' '+(new Date()));
    });
    socket.on('extend-connexion',function(){
      sockets[socket.id].time = (new Date()).getTime();
      console.log('>socket','extend-connexion',socket.id,'time',sockets[socket.id].time,(new Date()));
    });
  });
  
  var reformatTweet = function(tweet){
    return {
      id : tweet.id,
      text : tweet.text,
      screen_name: tweet.user.screen_name,
      created_at : tweet.created_at,
      coordinates : tweet.coordinates["coordinates"],
      profile_image_url:  tweet.user.profile_image_url,
      media_url_https: tweet.media_url_https,
      $channels : tweet.$channels,
      $keywords : tweet.$keywords,
      keywords: tweet.$keywords //This is for the model, can't use $
    };
  };
  
  var manageEventsBetweenTwitterAndSockets = function(stream){
    stream.on('connect',function(){
      twitterState = STATE_CONNECTING;
      io.emit('twitter:connect',{twitterState:twitterState});
    });
    stream.on('disconnect',function(){
      twitterState = STATE_DISCONNECTED;
      io.emit('twitter:disconnect',{twitterState:twitterState});
    });
    stream.on('connected',function(){
      //only emit oonce when it was disconnected
      if(twitterState === STATE_CONNECTED){
        return false;
      }
      twitterState = STATE_CONNECTED;
      io.emit('twitter:connected',{twitterState:twitterState});
    });
    stream.on('channels',function(tweet){
      if (tweet.coordinates != null) {
       // console.log("Tweet coordinates pass : " + JSON.stringify(tweet));
        var containsImageHTTPS = tweet.text.indexOf("https://t.co/");  //This is where Twitter posts images
        var containsImageHTTP = tweet.text.indexOf("http://t.co/");  //This is where Twitter posts images
        var tmpImageURL = null;

        if (tweet.entities["media"]) {
            tmpImageURL = tweet.entities.media[0].media_url_https;
        }
        else if (containsImageHTTPS > -1){
          tmpImageURL = tweet.text.substring(containsImageHTTPS);
        } else if (containsImageHTTP > -1) {
          tmpImageURL = tweet.text.substring(containsImageHTTP);
        }
        else {
          console.log("");
          console.log("No suitable tweet found..." + JSON.stringify(tweet));
          console.log("");
          return;
        }

        // if (tweet.user.lang == "es" && tweet.keywords[0] == "abra") {
        //   console.log("Language is Spanish and Abra detected.  Not saving");
        //   return;
        // }
        // Add the Picture URL to the Tweet
        tweet.media_url_https = tmpImageURL;

        console.log("");
        console.log ("Found acceptable Tweet w/ Image  : " + JSON.stringify(tweet));
        console.log("");
        // Remove unnecessary JSON data
        var formattedTweet = reformatTweet(tweet);

        // Apparently Twitter sends the response as LONG / LAT - so save the tweet exactly as is instead of swapping
        // Creates a new Tweet based on the Mongoose schema and the post body
        var newtweet = new Tweet(formattedTweet);

        // // New Tweet is saved in the db.
        newtweet.save(function(err){
            if(err) {
              console.log("");
              console.error("MongoDB error while saving Tweet " + JSON.stringify(err));
              console.log("Original Tweet: " + JSON.stringify(formattedTweet));
              console.log("dbTweet: " + JSON.stringify(tweet));
              console.log("");
              return;
            }
            // If no errors are found
            console.log("successfully saved Tweet: " + JSON.stringify(newtweet));
        });

        io.emit('data',formattedTweet);
      }
    });
  };
  
  /**
   * Loops through the sockets to check their activity,
   * if they've been opened for more than socketMaxAge ms,
   * emits to the front an event 
   */
  var cleanSockets = function(){
    console.log('>calling cleanSockets '+(new Date()));
    if(Object.keys(sockets).length > 0){
      var time = (new Date()).getTime();
      for(var socketId in sockets){
        if(sockets[socketId].time + socketMaxAge < time){
          console.log('>socket '+socketId+' inactive for '+(time - sockets[socketId].time)+'ms - disconnecting it'+' '+(new Date()));
          sockets[socketId].socket.emit('inactive-socket',{
            msg:"You have been inactive for "+(time - sockets[socketId].time)+"ms, you have been disconnected, please refresh your page.",
            timeout : (time - sockets[socketId].time)
          });
        }
      }
      cleanSocketsTimer = setTimeout(cleanSockets,cleanSocketsDelay);
    }
    else{
      console.log('>no sockets to clean');
      cleanSocketsTimer = null;
    }
  };
  
  /**
   * Manages the start and stop of the Twitter stream
   * - stops it after 15min, then restarts it if there are still sockets opened
   * - adds the events from the twitter stream to the socket
   */
  var launchStream = function(){
    console.log('>calling launchStream');
    launchStreamRunning = true;
    twitterStreamManager.launch(function(stream){
      twitterStreamRunning = true;
      manageEventsBetweenTwitterAndSockets(stream);
      launchStreamRunning = false;
    },function(stream){
      console.log('>stopping stream after timeout '+(new Date()));
      stream.stop();//stop the stream at timeout
      twitterState = STATE_DISCONNECTED;
      twitterStreamRunning = false;
      if(Object.keys(sockets).length !== 0){
        console.log('>relaunching stream after timeout ('+Object.keys(sockets).length+' sockets still opened)');
        launchStream();//relaunch if there is still people
      }
      else{
        console.log('>NOT relaunching stream after timeout ('+Object.keys(sockets).length+' socket still opened)');
      }
    });
    
    if(twitterStreamRunning === false && launchStreamRunning === false){
      launchStream();
    }
    
  };
  
  //public method to know the state of the socket manager
  this.getState = function(){
    var time = (new Date()).getTime();
    var older = null;
    var younger = null;
    if(Object.keys(sockets).length > 0){
      for(var socketId in sockets){
        if(older === null && younger === null){
          older = sockets[socketId].time;
          younger = sockets[socketId].time;
        }
        else if(sockets[socketId].time < older){
          older = sockets[socketId].time;
        }
        else if(sockets[socketId].time > younger){
          younger = sockets[socketId].time;
        }
      }
      older = socketMaxAge+older-time;
      younger = socketMaxAge+younger-time;
    }
    return {
      "sockets" : {
        "number" : Object.keys(sockets).length,
        "nextDisconnexionsIn" : {
          "older" : older,
          "younger" : younger
        }
      },
      "twitter" : {
        "state" : twitterState
      }
    };
  };
  
};

module.exports = SocketsManager;