'use strict';
var ngStyleDirective = ngDirective(function (scope, element, attr) {
	scope.$watch(attr.ngStyle, function ngStyleWatchAction(newStyles, oldStyles) {
		if (oldStyles && (newStyles !== oldStyles)) {
			forEach(oldStyles, function (val, style) {
				element.css(style, '');
			});
		}
		if (newStyles) element.css(newStyles);
	}, true);
});
