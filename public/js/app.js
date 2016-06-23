// Define the `phonecatApp` module
var aiopApp = angular.module('aiopApp', ['ngRoute', 'ui.bootstrap', 'ngCookies', 'ngFileUpload']);

aiopApp.config(function($routeProvider) {
        $routeProvider

            // route for the home page
            .when('/', {
                templateUrl : 'templates/modules.html',
                controller  : 'modulesCtrl'
            })
            
            .when('/module/:moduleId/documents',{
                templateUrl : 'templates/documents.html',
                controller  : 'documentsCtrl'
            })

            .when('/resetPassword/:resetToken',{
                templateUrl : 'templates/resetPassword.html',
                controller  : 'resetPasswordCtrl'
            })

            .when('/profile',{
                templateUrl : 'templates/profile.html',
                controller  : 'profileCtrl'
            })
            
            .when('/admin',{
                templateUrl : 'templates/admin.html',
                controller  : 'adminCtrl'
            });
    });
