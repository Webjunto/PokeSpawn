'use strict';

angular.module('tophemanDatavizApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'btford.socket-io',
  'ngAnimate',
  'angular-growl',
  'duScroll'
])

  .directive('setClassWhenAtTop', function ($window) {
    var $win = angular.element($window);

    return {
        restrict: "A",
        link: function (scope, element, attrs) {
            var topClass = attrs.setClassWhenAtTop,
                topPadding = parseInt(attrs.paddingWhenAtTop, 10),
                parent = element.parent(),
                offsetTop;

            $win.on("scroll", function () {
                // dynamic page layout so have to recalculate every time;
                // take offset of parent because after the element gets fixed
                // it now has a different offset from the top
                offsetTop = parent.offset().top - topPadding;
                if ($win.scrollTop() >= offsetTop) {
                    element.addClass(topClass);
                    parent.height(element.height());
                } else {
                    element.removeClass(topClass);
                    parent.css("height", null);
                }
            });
        }
    };
  })
  .config(function ($routeProvider, $locationProvider, growlProvider) {
    var routeResolver = {
      app: ['persistance',function(persistance) {
        return persistance.isInit();
      }]
    };
    $routeProvider
      .when('/', {
        templateUrl: 'app/controllers/main/main.html',
        controller: 'MainCtrl',
        resolve: routeResolver
      })
      .when('/catchingpokemon', {
        templateUrl: 'app/controllers/CatchingPokemon/catchingpokemon.html',
        controller: 'CatchingPokemonCtrl',
        resolve: routeResolver
      })
      .when('/whatsnext', {
        templateUrl: 'app/controllers/WhatsNext/whatsnext.html',
        controller: 'WhatsNextCtrl',
        resolve: routeResolver
      })
      .when('/signup', {
        templateUrl: 'app/controllers/Signup/signup.html',
        controller: 'SignupCtrl',
        resolve: routeResolver
      })
      .when('/channel/:channel', {
        templateUrl: 'app/controllers/channel/channel.html',
        controller: 'ChannelCtrl',
        resolve: routeResolver
      })
      .otherwise({
        redirectTo: '/'
      });

    $locationProvider.html5Mode(true);
    
    growlProvider.onlyUniqueMessages(false);
    growlProvider.globalPosition('bottom-right');
    growlProvider.globalReversedOrder(true);
    growlProvider.globalDisableCountDown(true);
    growlProvider.globalTimeToLive(8000);
  });