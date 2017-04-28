/**
 * Created by toor on 15-9-24.
 */
var myApp = angular.module("myApp", ['ui.router']);

myApp.config(function ($stateProvider, $urlRouterProvider) {

    $urlRouterProvider.when("", "/PageTabx");

    $stateProvider
        .state("PageTab", {
            url: "/PageTabx",
            templateUrl: "PageTab.html"
        })
        .state("PageTab.Page1", {
            url:"/Page1x",
            templateUrl: "PageTab/Page1.html"
        })
        .state("PageTab.Page2", {
            url:"/Page2y",
            templateUrl: "PageTab/Page2.html"
        })
        .state("PageTab.Page3", {
            url:"/Page3z",
            templateUrl: "PageTab/Page3.html"
        });
});