'use strict';
var htmlAnchorDirective = valueFn({
	restrict: 'E',
	compile: function (element, attr) {
		if (msie <= 8) {
			if (!attr.href && !attr.name) {
				attr.$set('href', '');
			}
			element.append(document.createComment('IE fix'));
		}
		return function (scope, element) {
			element.on('click', function (event) {

				if (!element.attr('href')) {
					event.preventDefault();
				}
			});
		};
	}
});
