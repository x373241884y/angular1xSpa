angular.module('MyApp.controllers', [])

    .controller('MainController', function($rootScope, $window, $scope){
        $scope.name = "Don Coyote"

        $scope.slide = '';

        $rootScope.$on('$stateChangeStart', function(){
            $scope.slide = $scope.slide || 'slide-left'
        });

        $rootScope.back = function(){
            $scope.slide = 'slide-right';
            $window.history.back();
        }

        $rootScope.forward = function(){
            $scope.slide = 'slide-left';
            $window.history.forward();
        }

    })