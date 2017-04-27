'use strict';
var ngShowDirective = ['$animate', function ($animate) {
	return function (scope, element, attr) {
		scope.$watch(attr.ngShow, function ngShowWatchAction(value) {
			$animate[toBoolean(value) ? 'removeClass' : 'addClass'](element, 'ng-hide');
		});
	};
}];
var ngHideDirective = ['$animate', function ($animate) {
	return function (scope, element, attr) {
		scope.$watch(attr.ngHide, function ngHideWatchAction(value) {
			$animate[toBoolean(value) ? 'addClass' : 'removeClass'](element, 'ng-hide');
		});
	};
}];
