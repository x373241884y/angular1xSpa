'use strict';
var ngPluralizeDirective = ['$locale', '$interpolate', function ($locale, $interpolate) {
	var BRACE = /{}/g;
	return {
		restrict: 'EA',
		link: function (scope, element, attr) {
			var numberExp = attr.count,
				whenExp = attr.$attr.when && element.attr(attr.$attr.when), // we have {{}} in attrs
				offset = attr.offset || 0,
				whens = scope.$eval(whenExp) || {},
				whensExpFns = {},
				startSymbol = $interpolate.startSymbol(),
				endSymbol = $interpolate.endSymbol(),
				isWhen = /^when(Minus)?(.+)$/;
			forEach(attr, function (expression, attributeName) {
				if (isWhen.test(attributeName)) {
					whens[lowercase(attributeName.replace('when', '').replace('Minus', '-'))] =
						element.attr(attr.$attr[attributeName]);
				}
			});
			forEach(whens, function (expression, key) {
				whensExpFns[key] =
					$interpolate(expression.replace(BRACE, startSymbol + numberExp + '-' +
						offset + endSymbol));
			});
			scope.$watch(function ngPluralizeWatch() {
				var value = parseFloat(scope.$eval(numberExp));
				if (!isNaN(value)) {
					//if explicit number rule such as 1, 2, 3... is defined, just use it. Otherwise,
					//check it against pluralization rules in $locale service
					if (!(value in whens)) value = $locale.pluralCat(value - offset);
					return whensExpFns[value](scope, element, true);
				} else {
					return '';
				}
			}, function ngPluralizeWatchAction(newVal) {
				element.text(newVal);
			});
		}
	};
}];
