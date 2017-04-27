'use strict';
var scriptDirective = ['$templateCache', function ($templateCache) {
	return {
		restrict: 'E',
		terminal: true,
		compile: function (element, attr) {
			if (attr.type == 'text/ng-template') {
				var templateUrl = attr.id,
				// IE is not consistent, in scripts we have to read .text but in other nodes we have to read .textContent
					text = element[0].text;
				$templateCache.put(templateUrl, text);
			}
		}
	};
}];
