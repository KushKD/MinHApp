var app = angular.module('App', ['ionic', 'ngCordova', 'ngAnimate','ngPatternRestrict'])

var ENV = "DEV"; // LIVE || DEV
var apiUrl=apiInvestorUrl="";
if(ENV == "LIVE"){
    apiUrl = 'http://emerginghimachal.hp.gov.in/miningstone/index.php/api/v1/';
    apiInvestorUrl = 'http://emerginghimachal.hp.gov.in/sso/apiv1/';
}
else{
    apiUrl = 'http://mining.eypoc.com/api/v1/'; // other api end point
    apiInvestorUrl = 'http://hp.eypoc.com/sso/apiv1/'; //login of applicant
}


app.constant('appConstants',{
    apiUrl:apiUrl,
    apiInvestorUrl:apiInvestorUrl,
    apiInvestorKey:'1-1eM@1\!T@908#723$$%%^&&*()Thakur)-=/.',
    apiKey:'!@#$%^&*()_++_)(*&&^%%%%',
    spTag:'Mining_$$',
    WebsiteUrl:'http://emerginghimachal.hp.gov.in/miningstone/',
});

app.run(function($cordovaStatusbar, $ionicPlatform, $localstorage, $location, $rootScope, $cordovaNetwork, $interval, $ionicViewSwitcher, $ionicHistory){
    $ionicPlatform.ready(function() {
        if(window.cordova && window.cordova.plugins.Keyboard) {
          cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
          cordova.plugins.Keyboard.disableScroll(true);
        }
        $cordovaStatusbar.overlaysWebView(true);
        $cordovaStatusbar.style(0);
        $cordovaStatusbar.styleHex('#A7A753');
        $cordovaStatusbar.hide();
        $cordovaStatusbar.show();

        function checkConnection(){
            $rootScope.$on('$cordovaNetwork:offline', function(event, networkState){
               $ionicViewSwitcher.nextDirection('back');
               $ionicHistory.nextViewOptions({
                   disableBack: true,
                   disableAnimate : true,
                   historyRoot  : true
               });
               $location.path("/app/offline");   
            })
            $rootScope.$on('$cordovaNetwork:online', function(event, networkState){
               $ionicViewSwitcher.nextDirection('back');
               $ionicHistory.nextViewOptions({
                   disableBack: true,
                   disableAnimate : true,
                   historyRoot  : true
               });
               $location.path("/app/landing");   
            })
        }
        $interval(function(){checkConnection()},100);
        var notificationOpenedCallback = function(jsonData) {
            console.log('notificationOpenedCallback: ' + JSON.stringify(jsonData));
        };
        window.plugins.OneSignal.enableVibrate(true);
        window.plugins.OneSignal.enableSound(true);
        window.plugins.OneSignal
        .startInit("bb37f655-315d-4797-b77f-2c457ca4af1a")
        .handleNotificationOpened(notificationOpenedCallback)
        .endInit();
    })
})

app.config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
    $ionicConfigProvider.views.maxCache(0);
    // $ionicConfigProvider.backButton.previousTitleText(false);
    $stateProvider
    .state('app', {
        url: '/app',
        abstract: true,
        controller: 'AppController',
        templateUrl: 'templates/menu.html'
    })
    .state('app.landing',{
        url: "/landing",
        views: {
            viewContent: {
                templateUrl: "templates/landing.html",
                controller: 'HomeController'
            }
        }
    })
    .state('app.Depdasboard', {
        url: "/Depdasboard",
        views: {
            viewContent: {
                templateUrl: "templates/depDashboard.html",
                controller: 'DeptController'
            }
        }
    })
    .state('app.LocationView', {
        url: "/LocationView",
        views: {
            viewContent: {
                templateUrl: "templates/LocationView.html",
                controller: 'LocationCtrl'
            }
        }
    })
    .state('app.invDashboard', {
        url: "/invDashboard",
        views: {
            viewContent: {
                templateUrl: "templates/invDashboard.html",
                controller: 'InvestorController'
            }
        }
    })
    .state('app.departmentLogin', {
        url: "/departmentLogin",
        views: {
            viewContent: {
                templateUrl: "templates/departmentLogin.html"
            }
        }
    })
    .state('app.investorLogin', {
        url: "/investorLogin",
        views: {    
            viewContent: {
                templateUrl: "templates/investorLogin.html"
            }
        }
    })
    .state('app.offline', {
        url: "/offline",
        views: {
            viewContent: {
                templateUrl: "templates/offline.html"
            }
        }
    })
    .state('app.mFormView', {
        url: "/mFormView/{mFormDetails}",
        params: {mFormDetails: null},
        views: {
            viewContent: {
                templateUrl: "templates/mFormView.html",
                controller: 'mFormViewController'
               
            }
        }
    })
    .state('app.timelineView', {
        url: '/timelineView/{appId}',
        params: {appId:null},
        views: {
            viewContent: {
                templateUrl: 'templates/timelineView.html',
                controller: 'timelineViewCtrl'
            }
        },
    })
    .state('app.appView', {
        url: '/appView/{appId}',
        views: {    
            viewContent: {
                templateUrl: 'templates/appView.html',
                controller: 'appViewCtrl'
            }
        },
    })
    .state('app.transitPassRequest', {
        url: "/transitPassRequest/{appId}",
        params: {color: null,icon: null,code:null,title:null},
        views: {
            viewContent: {
                templateUrl: "templates/transitPassRequest.html",
                controller: 'TransitPassRequestController'
            }
        }
    })

    .state('app.generateTransitPass', {
        url: "/generateTransitPass/{appId}",
        params: {color: null,icon: null,code:null,title:null},
        views: {
            viewContent: {
                templateUrl: "templates/generateTransitPass.html",
                controller: 'GenerateTransitPass'
            }
        }
    });
        
    $urlRouterProvider.otherwise(function ($injector, $location) {
        var $state = $injector.get("$state");
        $state.go("app.landing");
    });
});