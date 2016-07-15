pokespawn
===================

See the spawn points of Pokemon!

Summary : 

* [Presentation] (#presentation)
* [Build Instructions] (#instructions)
* [Todo List] (#todolist)



grunt build && cd dist && git add . && git commit -m "Updating heroku repository" && git push heroku master

topheman-datavisual
===================

[![image](http://dev.topheman.com/wp-content/uploads/2014/08/angular-topheman-logo-medium.png)](http://topheman-datavisual.herokuapp.com/)

This is the repository of the [topheman-datavisual project](http://topheman-datavisual.herokuapp.com/), I also made a less technical presentation on [this blog post](http://dev.topheman.com/datavisualization-with-angular-and-d3-on-the-twitter-stream-api).

Summary :

* [Presentation](#presentation)
* [Instructions](#instructions)

##Presentation

The goal of this project was to gather the live stream of twitter, and map it to people speaking about pokemon and uploading pictures.

The assumption is that if a person mentions Eevee and submits a photo, most likely that person has caught that Eevee.  With a high degree of certainty, this will give players *mostly* the correct information.

###twitter-stream-channels

Before even starting on the frontend part, I built [twitter-stream-channels](http://labs.topheman.com/twitter-stream-channels/), a node module that handles the post-processing of the tweets comming from the [Twitter Stream API](http://labs.topheman.com/twitter-stream-channels/) (I managed to include a built-in mock version of the module to work offline due to the connexion limits of Twitter).

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

###frontend

Finally ! We're talking about frontend, Angular, d3 and stuff ! Yeah, when I had this project in mind, I didn't think about doing so much backend ...

I made a [service to manage the transport/persistance layer](https://github.com/topheman/topheman-datavisual/blob/master/client/app/services/persistance/persistance.service.js) that is in charge of :

* retrieving the data from the websockets
* sharing this accross the app in realtime:
	* to the [d3 directives](https://github.com/topheman/topheman-datavisual/tree/master/client/app/directives/d3)
	* to the [state/notifications directives](https://github.com/topheman/topheman-datavisual/blob/master/client/app/directives/stateNotifications/stateNotifications.directive.js)

I made four kinds of d3 directives : tree chart, pack chart, pie chart and bar chart. They are home made (this was the challenge). I made them responsive, it works, but I don't know if it is the best way (one thing to take in account is that the data is not static but dynamic and updated in realtime).

Whatever, the first thing you must understand in d3 are the enter/update/remove phases.

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

And on recurring builds...
6. grunt build && cd dist && git add . && git commit -m "Updating heroku repository" && git push heroku master

## Todo

1.  Add a limit to # of past tweets the browser pulls up initially
2.  Add a filter for Location & a boundary radius
3.  Add a filter for type of Pokemon
4.  Add a filter for Time Elapsed
7.  Live stream of latest tweets as they come in
8.  Add Mongoose connection string

###Notes

####Channels

The channels are configured server-side in `server/config/channelsDescription.json`. This configuration is retrieved at the first websocket connexion between the browser and the nodejs server.

####Apis

`/api/state` to know the state of the server (how many sockets opened / state of the twitter connexion) - easier than connecting by ssh to watch the logs. Since it's only a POC, this isn't an issue, I wouldn't advise it on a production site.

####Client dependencies

This is a list of the exact versions used in bower_components (in case there was a mix up with bower). I freezed the bower.json to avoid conflicts and regressions.

```