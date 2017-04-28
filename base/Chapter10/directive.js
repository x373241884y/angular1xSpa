/**
 * Created by toor on 15-9-7.
 */
(function () {
    var directive = {};
    directive.uiSliderbar = ['uiSliderbar', '$timeout',
        function (uiSliderbar, $timeout) {

            return {
                restrict: 'CA',
                link: function (scope, element, attr) {
                    //新修改
                    scope.$watch(attr.uiSliderbar, function (newVal, oldVal) {
                        if (newVal) {
                            $timeout(function () {
                                var options = $.extend({}, vx.fromJson(newVal || {}));
                                uiSliderbar.resetSliderbar(options, element);
                            }, 1);
                        }

                    });
                }
            };
        }];
    directive.directive02 = ['uiSliderbar', '$timeout',
        function (uiSliderbar, $timeout) {

            return {
                restrict: 'CA',
                link: function (scope, element, attr) {
                    //新修改
                    scope.$watch(attr.uiSliderbar, function (newVal, oldVal) {
                        if (newVal) {
                            $timeout(function () {
                                var options = $.extend({}, vx.fromJson(newVal || {}));
                                uiSliderbar.resetSliderbar(options, element);
                            }, 1);
                        }

                    });
                }
            };
        }];

    vx.module('app').directive(directive);
}());

(function () {
    var app = vx.module("app").directive("directiveName", function () {
        return {
            restrict: String,//"EACM" //分别表示元素、属性、Class、注释  ,默认为A\可选
            priority: 0,//优先级,0最低,默认为0  可选
            terminal: "false",//停止执行比当前指令优先级低的指令,true,表示停止,默认未false、可选
            template: "",//HTML字符串 可选
            templateUrl: "../htmls/xxx.html",//制定html路径作为模板 可选
            replace: "true",//是否替换指令  默认为false 可选
            scope: "ngModel",// //可选 默认未false, true 时从父scope中继承并创建一个新的作用域
            transclude: "false",//默认未false, 只有当你希望创建一个可以包含任意内容的指令时,才让该值为true
            controller: function ($scope, $element, $attr, $transclude) {
                //控制器逻辑//$scope与当前元素相关连的当前作用域
                //$element  当前指令对应的元素
                //$attrs  由当前元素的属性组成的对象
                //transclude 嵌入链接函数会与对应的嵌入作用域进行预绑定
            }
            , //字符串或控制器构造函数
            controllerAs: "myController",//设置控制器别名
            require: String,
            link: function (scope, element, attrs) {

            },
            compile: function (element, attr) {
                return {
                    pre: function (scope, element, attrs, controoler) {

                    },
                    post: function (scope, element, attrs, controller) {

                    }
                }
                //或者
                return function postLink(scope, element, attrs) {

                };
            }
        }
    })
}());