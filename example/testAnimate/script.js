angular
    .module('MyApp', [
        'ui.router',
        'ngAnimate',
        'MyApp.controllers'
    ])
    .config(function ($urlRouterProvider, $stateProvider) {

        $stateProvider
            .state('tab1',
            {
                url: "/tab1",
                templateUrl: "tab1.html"
            })
            .state('tab2',
            {
                url: "/tab2",
                templateUrl: "tab2.html"
            })
            .state('tab3',
            {
                url: "/tab3",
                templateUrl: "tab3.html"
            });

        $urlRouterProvider.otherwise('/tab1');

    });