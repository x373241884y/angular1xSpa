'use strict';
var ngBindDirective = ngDirective(function (scope, element, attr) {
	element.addClass('ng-binding').data('$binding', attr.ngBind);
	scope.$watch(attr.ngBind, function ngBindWatchAction(value) {
		// We are purposefully using == here rather than === because we want to
		// catch when value is "null or undefined"
		// jshint -W041
		element.text(value == undefined ? '' : value);
	});
});
var ngBindTemplateDirective = ['$interpolate', function ($interpolate) {
	return function (scope, element, attr) {
		// TODO: move this to scenario runner
		var interpolateFn = $interpolate(element.attr(attr.$attr.ngBindTemplate));
		element.addClass('ng-binding').data('$binding', interpolateFn);
		attr.$observe('ngBindTemplate', function (value) {
			element.text(value);
		});
	};
}];
var ngBindHtmlDirective = ['$sce', '$parse', function ($sce, $parse) {
	return function (scope, element, attr) {
		element.addClass('ng-binding').data('$binding', attr.ngBindHtml);
		var parsed = $parse(attr.ngBindHtml);

		function getStringValue() {
			return (parsed(scope) || '').toString();
		}

		scope.$watch(getStringValue, function ngBindHtmlWatchAction(value) {
			element.html($sce.getTrustedHtml(parsed(scope)) || '');
		});
	};
}];
