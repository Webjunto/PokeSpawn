Pokespawn
===================

Summary : 

* [Presentation] (#presentation)
* [Build Instructions] (#instructions)

Summary :

* [Presentation](#presentation)
* [Instructions](#instructions)

##Presentation

The goal of this project was to gather the live stream of twitter, and map it to people speaking about pokemon and uploading pictures.

The assumption is that if a person mentions Eevee and submits a photo, most likely that person has caught that Eevee.  With a high degree of certainty, this will give players *mostly* the correct information.

###twitter-stream-channels

This is based on Topheman's Twitter Stream API and Data-visualization Project.  BE SURE TO SEE FULL PROJECT DETAILS HERE BEFORE DEVELOPMENT!

[twitter-stream-channels](http://labs.topheman.com/twitter-stream-channels/), a node module that handles the post-processing of the tweets comming from the [Twitter Stream API](http://labs.topheman.com/twitter-stream-channels/) (I managed to include a built-in mock version of the module to work offline due to the connexion limits of Twitter).

[Data-visualization/MEAN Stack Application](http://topheman-datavisual.herokuapp.com/) 
[Source Code the project is based from](https://github.com/topheman/topheman-datavisual)

###constraints / backend / connexions management

The Twitter Stream API has a [rate limit](https://dev.twitter.com/docs/rate-limiting/1.1). Simply put, you have 15 minutes windows : if you make too much connexions/disconnexions you'll be stall for the end of the window.

On the other hand, **the browser is not connected directly to Twitter Stream** but by websockets (through my node server, using socket.io).

As you can see, browser connects to node that connects to Twitter. So to know when to close each connexions, I made some choices :

I setup a **maxAge on the websockets** and a routine that runs every minutes to close the websockets which are too old. Once no more websockets are opened, this routine stops (so no more timers).

An other routine runs every 15 minutes to check if there are still websockets opened. If there are, it relaunches the Twitter connexion, if not, it cleanly closes it.

This way, I'm sure the connexion is always opened when browsers are connected via websockets and also, when no more people are connected, it cleanly closes the connexion with Twitter, with no more timer remaining. At that time, the node process can safely be shutdown as the VM (project hosted on heroku) ...

Possible states :

* websocket connected / Twitter Stream connected (that's when you retrieve data)
* websocket connected / Twitter Stream disconnected (possible disconnexion from twitter, attempting to reconnect)
* websocket disconnected / Twitter Stream connected (your browser has been forced to disconnect due to inactivity or is experiencing network problem but the node server is still up and connected to Twitter)
* websocket disconnected / Twitter Stream disconnected (your browser is disconnected, the node server is disconnected from Twitter because no more people on the websockets - the process can be shut down)


##Instructions

###Requirements

* node (works on node v0.12, v4 & v5)
* grunt, bower
* sass
* (optional) yeoman generator-angular-fullstack - scaffolded with [yeoman generator-angular-fullstack v2.05](https://github.com/DaftMonk/generator-angular-fullstack/tree/v2.0.5)

###Install

* `npm install`
* `bower install`
* copy `server/config/local.env.default.js` to `server/config/local.env.js` and set your twitter credentials there (for dev purposes)
* grunt serve - you're good to go (more in the launch section)

###Launch

* `grunt serve` : will launch in development mocked mode (offline - no connection to twitter)
* `grunt serve:online` : will launch with a connection to twitter, using the credentials you set to open the stream to twitter.

###Deployment

To heroku :

1.  `grunt build` command will build the site in the `/dist` folder
2.  cd dist/
3.  git init (or connect repo) to heroku from here
4.  [Configure the Twitter credention as env variables on heroku](https://devcenter.heroku.com/articles/getting-started-with-nodejs#define-config-vars)
5. heroku config:set NODE_ENV=production

Recurring builds...

6. grunt build && cd dist && git add . && git commit -m "Updating heroku repository" && git push heroku master

### MongoDB Connections

mongo ds021979.mlab.com:21979/heroku_x4rm9c3c -u heroku_x4rm9c3c -p 3j0t2u324t533jg3gf2moo9q74

mongodb://heroku_sbc5jf99:d7f9e1atop1uglohcm43ro435p@ds023565-a0.mlab.com:23565,ds023565-a1.mlab.com:23565/heroku_sbc5jf99?replicaSet=rs-ds023565

mongo ds023565-a0.mlab.com:23565/<database> -u heroku_sbc5jf99 -p zx3tj6bxMl!

Connect Shell:  mongo ds023585-a0.mlab.com:23585/heroku_x4rm9c3c -u original_jedi_12345 -p coollio5
mongo ds023585-a0.mlab.com:23585/heroku_x4rm9c3c -u original_jedi_12345 -p coollio5

database_username:  heroku_x4rm9c3c
username:           original_jedi_12345
password:           coollio5


###Notes

####Channels

The channels are configured server-side in `server/config/channelsDescription.json`. This configuration is retrieved at the first websocket connexion between the browser and the nodejs server.

####Apis

`/api/state` to know the state of the server (how many sockets opened / state of the twitter connexion) - easier than connecting by ssh to watch the logs. Since it's only a POC, this isn't an issue, I wouldn't advise it on a production site.

####Client dependencies

This is a list of the exact versions used in bower_components (in case there was a mix up with bower). I freezed the bower.json to avoid conflicts and regressions.

```

### Useful Query from Mongo Shell to fix old tweets
db.jediusers.find().forEach(function (e) {
    // assuming that `geoJson` is our field containing `coordinates`
    e.coordinates = [ // Swapping Lat/Lon
        e.coordinates[1], // Longitude goes first
        e.coordinates[0] // Latitude goes last
    ];
    db.jediusers.save(e);
    // Some `print(e.name)` can go here just to understand the progress
});


https://api.twitter.com/1.1/search/tweets.json?q=caught%20Bulbasaur%2C%20OR%20Ivysaur%2C%20OR%20Venusaur%2C%20OR%20Charmander%2C%20OR%20Charmeleon%2C%20OR%20Charizard%2C%20OR%20Squirtle%2C%20OR%20Wartortle%2C%20OR%20Blastoise%2C%20OR%20Caterpie%2C%20OR%20Metapod%2C%20OR%20Butterfree%2C%20OR%20Weedle%2C%20OR%20Kakuna%2C%20OR%20Beedrill%2C%20OR%20Pidgey%2C%20OR%20Pidgeotto%2C%20OR%20Pidgeot%2C%20OR%20Rattata%2C%20OR%20Raticate%2C%20OR%20Spearow%2C%20OR%20Fearow%2C%20OR%20Ekans%2C%20OR%20Arbok%2CPikachu%20%23pokemongo%20lang%3Aen&src=typd

