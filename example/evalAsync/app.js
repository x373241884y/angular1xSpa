var app = angular.module('plunker', []);

app.controller('MainCtrl', function ($scope) {
	$scope.name = 'World';
	$scope.$evalAsync(function () {
		console.log('evalAsync<<?');
	});
});
function EmptyCtrl() {

}
function Ctrl($scope) {
	$scope.counter = 0;
	$scope.count = function() {
		$scope.counter ++;
		console.log("setting value to "+$scope.counter)
	};

	var lastValue;
	$scope.$watch(function() {
		var value= $scope.counter;
		if (value!==lastValue) {
			lastValue = value;
			$scope.$evalAsync(function () {
				console.log("value in $evalAsync: "+value)
			});
		}
	});
}

app.directive("input", ['$browser', '$timeout', '$filter', '$parse','$rootScope',
	function ($browser, $timeout, $filter, $parse,$rootScope) {
		return {
			restrict: 'E',
			require: '?ngModel',
			link: function (scope, element, attrs, ngModelCtrl) {
				if (ngModelCtrl) {
					var config = {
						required: false,
						disabled: false,
						readonly: false,
					}, token;
					token = attrs.name;

					if ("field" in scope && scope.hasOwnProperty("field")) {
						scope.field[token] = config;
					} else {
						scope.field = {};
						scope.field[token] = config;
					}


					ngModelCtrl.$formatters.unshift(requiredValidator);
					ngModelCtrl.$parsers.push(requiredValidator);
					scope.$watch(function () {
						//console.log('watch...<<<>>>');
						//disabledControl();
						//readonlyControl();
						//$rootScope.$evalAsync(function () {
						//	console.log('evalAsync<<?????');
						//});
						//return requiredValidator(ngModelCtrl.$viewValue);
					});
				}
				function requiredValidator(value) {
					if (attrs.required || attrs.vRequired) {
						return value;
					}
					if (config.required && ngModelCtrl.$isEmpty(value)) {
						ngModelCtrl.$setValidity("required", false);
						return void 0;

					} else {
						ngModelCtrl.$setValidity("required", true);
					}
					return value;
				};
				function disabledControl() {
					if (attrs.disabled || attrs.vDisabled) {
						return;
					}
					if (config.disabled) {
						element.attr("disabled", true);
					} else {
						element.attr("disabled", false);

					}
				};
				function readonlyControl() {
					if (attrs.readonly || attrs.vReadonly) {
						return;
					}
					if (config.readonly) {
						element.attr("readonly", true);
					} else {
						element.attr("readonly", false);
					}
				};

			}
		}
	}]
);